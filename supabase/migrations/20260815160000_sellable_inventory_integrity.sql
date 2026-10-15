-- Sellable inventory is exact purchase-lane × creator-mode stock.
-- A card can be reserved or delivered only when it is:
--   high band, score >= 80, quality_floor_passed,
--   unused, unreserved, renderable, and tagged to the selected persona.
-- Category-wide persona fallback is removed so checkout cannot hand
-- a buyer a leftover or wrong-mode card.

create or replace function public.card_payload_is_sellable(p_card jsonb, p_title text)
returns boolean
language sql
immutable
parallel safe
as $$
  select
    p_card is not null
    and jsonb_typeof(p_card) = 'object'
    and length(trim(both from coalesce(nullif(p_card ->> 'title', ''), p_title, ''))) >= 2
    and (
      (jsonb_typeof(p_card -> 'steps') = 'array' and jsonb_array_length(p_card -> 'steps') >= 3)
      or (jsonb_typeof(p_card -> 'scene_script') = 'array' and jsonb_array_length(p_card -> 'scene_script') >= 1)
    );
$$;

create or replace function public.idea_has_sellable_card(p_idea_id uuid)
returns boolean
language sql
stable
parallel safe
as $$
  select exists (
    select 1
    from public.idea_cards ic
    where ic.idea_id = p_idea_id
      and public.card_payload_is_sellable(ic.card, ic.title)
  );
$$;

create or replace function public.inventory_scope_matches_candidate(
  p_idea_id uuid,
  p_category_id uuid,
  p_persona_id uuid
)
returns boolean
language sql
stable
parallel safe
as $$
  select not exists (
    select 1
    from public.idea_candidates cand
    where cand.id = p_idea_id
      and (
        (cand.category_id is not null and cand.category_id <> p_category_id)
        or (cand.persona_id is not null and cand.persona_id <> p_persona_id)
      )
  );
$$;

create or replace function public.inventory_row_is_sellable(inv public.idea_inventory)
returns boolean
language sql
stable
parallel safe
as $$
  select
    inv.status = 'available'::public.inventory_status
    and inv.reuse_count = 0
    and inv.max_reuse_count = 1
    and inv.quality_floor_passed is true
    and inv.internal_rank_score >= 80
    and public.idea_has_sellable_card(inv.idea_id)
    and public.inventory_scope_matches_candidate(inv.idea_id, inv.category_id, inv.persona_id);
$$;

create index if not exists idea_inventory_sellable_idx
on public.idea_inventory (category_id, persona_id, score_band, internal_rank_score desc, published_at, id)
where status = 'available'::public.inventory_status
  and reuse_count = 0
  and max_reuse_count = 1
  and quality_floor_passed is true;

-- Align leftover rows to the candidate they were generated for.
update public.idea_inventory inv
set category_id = cand.category_id,
    persona_id = cand.persona_id,
    metadata = coalesce(inv.metadata, '{}'::jsonb) || jsonb_build_object(
      'scope_realigned_at', now(),
      'previous_category_id', inv.category_id,
      'previous_persona_id', inv.persona_id
    ),
    updated_at = now()
from public.idea_candidates cand
where cand.id = inv.idea_id
  and inv.status = 'available'::public.inventory_status
  and inv.reuse_count = 0
  and cand.category_id is not null
  and cand.persona_id is not null
  and (inv.category_id <> cand.category_id or inv.persona_id <> cand.persona_id);

-- High-only sellable floor. Do not retire paid/delivered rows.
update public.idea_inventory
set score_band = 'low'::public.score_band,
    quality_floor_passed = false,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('unsellable_reason', 'below_high_floor'),
    updated_at = now()
where status = 'available'::public.inventory_status
  and reuse_count = 0
  and (internal_rank_score < 80 or quality_floor_passed is not true);

update public.idea_inventory inv
set status = 'paused'::public.inventory_status,
    quality_floor_passed = false,
    metadata = coalesce(inv.metadata, '{}'::jsonb) || jsonb_build_object('unsellable_reason', 'empty_or_unrenderable_card'),
    updated_at = now()
where inv.status = 'available'::public.inventory_status
  and inv.reuse_count = 0
  and not exists (
    select 1
    from public.checkout_inventory_reservations reserved
    where reserved.status = 'active'
      and reserved.expires_at >= now() - interval '15 minutes'
      and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
  )
  and not public.idea_has_sellable_card(inv.idea_id);

drop function if exists public.available_inventory_counts(text);

create or replace function public.available_inventory_counts(
  p_category_slug text,
  p_persona_slug text default null
)
returns table (score_band public.score_band, available_count bigint)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    inv.score_band,
    count(*)::bigint as available_count
  from public.idea_inventory inv
  join public.categories c on c.id = inv.category_id
  join public.creator_personas p on p.id = inv.persona_id
  where c.slug = p_category_slug
    and c.enabled = true
    and p.enabled = true
    and (p_persona_slug is null or p.slug = p_persona_slug)
    and public.inventory_row_is_sellable(inv)
    and not exists (
      select 1
      from public.idea_box_items used
      where used.inventory_id = inv.id
         or used.idea_id = inv.idea_id
    )
    and not exists (
      select 1
      from public.checkout_inventory_reservations reserved
      where reserved.status = 'active'
        and reserved.expires_at >= now() - interval '15 minutes'
        and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
    )
  group by inv.score_band;
$$;

create or replace function public.inventory_health()
returns table (
  category_slug text,
  persona_slug text,
  low_count bigint,
  mid_count bigint,
  high_count bigint,
  low_target integer,
  mid_target integer,
  high_target integer,
  low_threshold integer,
  mid_threshold integer,
  high_threshold integer,
  needs_generation boolean
)
language sql
security invoker
set search_path = public, pg_temp
as $$
  with pairs as (
    select c.id as category_id, p.id as persona_id
    from public.categories c
    cross join public.creator_personas p
    where c.enabled = true
      and p.enabled = true
    union
    select inv.category_id, inv.persona_id
    from public.idea_inventory inv
  ),
  counts as (
    select
      pairs.category_id,
      pairs.persona_id,
      count(inv.id) filter (
        where inv.score_band = 'low'
          and public.inventory_row_is_sellable(inv)
          and not exists (
            select 1
            from public.idea_box_items used
            where used.idea_id = inv.idea_id
               or used.inventory_id = inv.id
          )
          and not exists (
            select 1
            from public.checkout_inventory_reservations reserved
            where reserved.status = 'active'
              and reserved.expires_at >= now() - interval '15 minutes'
              and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
          )
      ) as low_count,
      count(inv.id) filter (
        where inv.score_band = 'mid'
          and public.inventory_row_is_sellable(inv)
          and not exists (
            select 1
            from public.idea_box_items used
            where used.idea_id = inv.idea_id
               or used.inventory_id = inv.id
          )
          and not exists (
            select 1
            from public.checkout_inventory_reservations reserved
            where reserved.status = 'active'
              and reserved.expires_at >= now() - interval '15 minutes'
              and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
          )
      ) as mid_count,
      count(inv.id) filter (
        where inv.score_band = 'high'
          and public.inventory_row_is_sellable(inv)
          and not exists (
            select 1
            from public.idea_box_items used
            where used.idea_id = inv.idea_id
               or used.inventory_id = inv.id
          )
          and not exists (
            select 1
            from public.checkout_inventory_reservations reserved
            where reserved.status = 'active'
              and reserved.expires_at >= now() - interval '15 minutes'
              and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
          )
      ) as high_count
    from pairs
    left join public.idea_inventory inv
      on inv.category_id = pairs.category_id
     and inv.persona_id = pairs.persona_id
    group by pairs.category_id, pairs.persona_id
  )
  select
    c.slug as category_slug,
    p.slug as persona_slug,
    counts.low_count,
    counts.mid_count,
    counts.high_count,
    0 as low_target,
    0 as mid_target,
    30 as high_target,
    0 as low_threshold,
    0 as mid_threshold,
    8 as high_threshold,
    counts.high_count < 8 as needs_generation
  from counts
  join public.categories c on c.id = counts.category_id
  join public.creator_personas p on p.id = counts.persona_id
  order by needs_generation desc, c.sort_order, p.sort_order, c.slug, p.slug;
$$;

create or replace function public.reserve_checkout_inventory(
  p_checkout_session_id uuid,
  p_user_id uuid,
  p_box_product_slug text,
  p_category_slug text,
  p_persona_slug text,
  p_expires_at timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product public.box_products%rowtype;
  v_checkout public.checkout_sessions%rowtype;
  v_category_id uuid;
  v_persona_id uuid;
  v_band public.score_band;
  v_needed integer;
  v_slot_index integer := 1;
  v_inventory_id uuid;
  v_idea_id uuid;
  v_existing integer;
begin
  if p_checkout_session_id is null or p_user_id is null then
    raise exception 'checkout session and user are required';
  end if;

  if p_expires_at <= now() then
    raise exception 'reservation expiry must be in the future';
  end if;

  perform public.release_expired_checkout_inventory();

  select *
  into v_checkout
  from public.checkout_sessions
  where id = p_checkout_session_id
  for update;

  if not found or v_checkout.user_id <> p_user_id then
    raise exception 'checkout session does not belong to user';
  end if;

  select *
  into v_product
  from public.box_products
  where slug = p_box_product_slug
    and id = v_checkout.box_product_id
    and enabled = true;

  if not found then
    raise exception 'box product not found';
  end if;

  select id
  into v_category_id
  from public.categories
  where slug = p_category_slug
    and id = v_checkout.category_id
    and enabled = true;

  select id
  into v_persona_id
  from public.creator_personas
  where slug = p_persona_slug
    and id = v_checkout.persona_id
    and enabled = true;

  if v_category_id is null or v_persona_id is null then
    raise exception 'category or persona not found';
  end if;

  select count(*)::integer
  into v_existing
  from public.checkout_inventory_reservations
  where checkout_session_id = p_checkout_session_id
    and status = 'active';

  if v_existing > 0 then
    if v_existing <> v_product.idea_count then
      raise exception 'checkout has an incomplete reservation';
    end if;
    return v_existing;
  end if;

  for v_band in
    select unnest(array['low', 'mid', 'high']::public.score_band[])
  loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);

    for v_loop_index in 1..v_needed loop
      v_inventory_id := null;
      v_idea_id := null;

      select inv.id, inv.idea_id
      into v_inventory_id, v_idea_id
      from public.idea_inventory inv
      where inv.category_id = v_category_id
        and inv.persona_id = v_persona_id
        and inv.score_band = v_band
        and public.inventory_row_is_sellable(inv)
        and not exists (
          select 1
          from public.idea_box_items used
          where used.inventory_id = inv.id
             or used.idea_id = inv.idea_id
        )
        and not exists (
          select 1
          from public.checkout_inventory_reservations reserved
          where reserved.status = 'active'
            and reserved.expires_at >= now() - interval '15 minutes'
            and (reserved.inventory_id = inv.id or reserved.idea_id = inv.idea_id)
        )
      order by
        inv.internal_rank_score desc,
        inv.published_at asc,
        inv.id
      limit 1
      for update skip locked;

      if v_inventory_id is null then
        raise exception 'insufficient approved inventory for band %', v_band::text;
      end if;

      insert into public.checkout_inventory_reservations (
        checkout_session_id,
        user_id,
        inventory_id,
        idea_id,
        assigned_band,
        slot_index,
        expires_at
      ) values (
        p_checkout_session_id,
        p_user_id,
        v_inventory_id,
        v_idea_id,
        v_band,
        v_slot_index,
        p_expires_at
      );

      v_slot_index := v_slot_index + 1;
    end loop;
  end loop;

  if v_slot_index - 1 <> v_product.idea_count then
    raise exception 'reservation count does not match product allocation';
  end if;

  return v_slot_index - 1;
end;
$$;

create or replace function public.deliver_idea_box(
  p_user_id uuid,
  p_box_product_slug text,
  p_category_slug text,
  p_persona_slug text,
  p_purchase_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product public.box_products%rowtype;
  v_category_id uuid;
  v_persona_id uuid;
  v_delivery_id uuid;
  v_band public.score_band;
  v_needed integer;
  v_available integer;
  v_slot_index integer := 1;
  v_inventory_id uuid;
  v_idea_id uuid;
  v_existing_status public.box_delivery_status;
  v_loop_index integer;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_purchase_id is not null then
    select id, status
    into v_delivery_id, v_existing_status
    from public.idea_box_deliveries
    where purchase_id = p_purchase_id
    for update;

    if v_delivery_id is not null and v_existing_status = 'delivered' then
      return v_delivery_id;
    end if;
  end if;

  select *
  into v_product
  from public.box_products
  where slug = p_box_product_slug
    and enabled = true;

  if not found then
    raise exception 'box product not found: %', p_box_product_slug;
  end if;

  select id
  into v_category_id
  from public.categories
  where slug = p_category_slug
    and enabled = true;

  if v_category_id is null then
    raise exception 'category not found: %', p_category_slug;
  end if;

  select id
  into v_persona_id
  from public.creator_personas
  where slug = p_persona_slug
    and enabled = true;

  if v_persona_id is null then
    raise exception 'persona not found: %', p_persona_slug;
  end if;

  for v_band in
    select unnest(array['low', 'mid', 'high']::public.score_band[])
  loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);

    if v_needed > 0 then
      select count(*)::integer
      into v_available
      from public.idea_inventory inv
      where inv.category_id = v_category_id
        and inv.persona_id = v_persona_id
        and inv.score_band = v_band
        and public.inventory_row_is_sellable(inv)
        and not exists (
          select 1
          from public.idea_box_items used
          where used.idea_id = inv.idea_id
             or used.inventory_id = inv.id
        );

      if v_available < v_needed then
        if v_delivery_id is null then
          insert into public.idea_box_deliveries (
            user_id,
            purchase_id,
            box_product_id,
            category_id,
            persona_id,
            status,
            allocation,
            failure_reason
          ) values (
            p_user_id,
            p_purchase_id,
            v_product.id,
            v_category_id,
            v_persona_id,
            'needs_inventory',
            v_product.allocation,
            format(
              'insufficient %s inventory for %s / %s: needed %s, available %s',
              v_band::text,
              p_category_slug,
              p_persona_slug,
              v_needed,
              v_available
            )
          )
          returning id into v_delivery_id;
        else
          update public.idea_box_deliveries
          set user_id = p_user_id,
              box_product_id = v_product.id,
              category_id = v_category_id,
              persona_id = v_persona_id,
              status = 'needs_inventory',
              allocation = v_product.allocation,
              failure_reason = format(
                'insufficient %s inventory for %s / %s: needed %s, available %s',
                v_band::text,
                p_category_slug,
                p_persona_slug,
                v_needed,
                v_available
              ),
              delivered_at = null
          where id = v_delivery_id;
        end if;

        return v_delivery_id;
      end if;
    end if;
  end loop;

  if v_delivery_id is null then
    insert into public.idea_box_deliveries (
      user_id,
      purchase_id,
      box_product_id,
      category_id,
      persona_id,
      status,
      allocation
    ) values (
      p_user_id,
      p_purchase_id,
      v_product.id,
      v_category_id,
      v_persona_id,
      'pending',
      v_product.allocation
    )
    returning id into v_delivery_id;
  else
    update public.idea_box_deliveries
    set user_id = p_user_id,
        box_product_id = v_product.id,
        category_id = v_category_id,
        persona_id = v_persona_id,
        status = 'pending',
        allocation = v_product.allocation,
        failure_reason = null,
        delivered_at = null
    where id = v_delivery_id;

    delete from public.idea_box_items
    where delivery_id = v_delivery_id;
  end if;

  for v_band in
    select unnest(array['low', 'mid', 'high']::public.score_band[])
  loop
    v_needed := coalesce((v_product.allocation ->> v_band::text)::integer, 0);

    for v_loop_index in 1..v_needed loop
      v_inventory_id := null;
      v_idea_id := null;

      select inv.id, inv.idea_id
      into v_inventory_id, v_idea_id
      from public.idea_inventory inv
      where inv.category_id = v_category_id
        and inv.persona_id = v_persona_id
        and inv.score_band = v_band
        and public.inventory_row_is_sellable(inv)
        and not exists (
          select 1
          from public.idea_box_items used
          where used.idea_id = inv.idea_id
             or used.inventory_id = inv.id
        )
      order by
        inv.internal_rank_score desc,
        inv.published_at asc,
        inv.id
      limit 1
      for update skip locked;

      if v_inventory_id is null then
        raise exception 'inventory changed during delivery for band %', v_band::text;
      end if;

      insert into public.idea_box_items (
        delivery_id,
        user_id,
        inventory_id,
        idea_id,
        slot_index,
        assigned_band
      ) values (
        v_delivery_id,
        p_user_id,
        v_inventory_id,
        v_idea_id,
        v_slot_index,
        v_band
      );

      update public.idea_inventory
      set reuse_count = 1,
          max_reuse_count = 1,
          last_assigned_at = now(),
          status = 'retired'::public.inventory_status
      where id = v_inventory_id;

      v_slot_index := v_slot_index + 1;
    end loop;
  end loop;

  update public.idea_box_deliveries
  set status = 'delivered',
      delivered_at = now()
  where id = v_delivery_id;

  return v_delivery_id;
end;
$$;

create or replace function public.replace_reported_card(
  p_report_id uuid,
  p_replacement_inventory_id uuid,
  p_admin_user_id uuid,
  p_admin_feedback text,
  p_admin_private_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.card_reports%rowtype;
  v_item public.idea_box_items%rowtype;
  v_delivery public.idea_box_deliveries%rowtype;
  v_new_inventory public.idea_inventory%rowtype;
  v_now timestamptz := now();
begin
  select *
  into v_report
  from public.card_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'card report not found';
  end if;

  if v_report.status <> 'under_review' then
    raise exception 'card report is not under review';
  end if;

  select *
  into v_item
  from public.idea_box_items
  where id = v_report.delivery_item_id
  for update;

  if not found then
    raise exception 'delivery item not found';
  end if;

  select *
  into v_delivery
  from public.idea_box_deliveries
  where id = v_report.delivery_id
  for update;

  if not found then
    raise exception 'delivery not found';
  end if;

  select *
  into v_new_inventory
  from public.idea_inventory
  where id = p_replacement_inventory_id
  for update;

  if not found then
    raise exception 'replacement inventory not found';
  end if;

  if not public.inventory_row_is_sellable(v_new_inventory)
    or v_new_inventory.score_band <> 'high' then
    raise exception 'replacement inventory is not sellable';
  end if;

  if exists (
    select 1
    from public.idea_box_items used
    where used.idea_id = v_new_inventory.idea_id
       or used.inventory_id = v_new_inventory.id
  ) then
    raise exception 'replacement inventory has already been assigned';
  end if;

  if v_new_inventory.category_id <> v_delivery.category_id
    or v_new_inventory.persona_id <> v_delivery.persona_id then
    raise exception 'replacement must match the same category and creator mode';
  end if;

  if v_new_inventory.idea_id = v_item.idea_id then
    raise exception 'replacement cannot be the reported card';
  end if;

  insert into public.card_report_replacements (
    report_id,
    user_id,
    delivery_id,
    delivery_item_id,
    old_idea_id,
    old_inventory_id,
    new_idea_id,
    new_inventory_id,
    replaced_by,
    metadata
  ) values (
    v_report.id,
    v_report.user_id,
    v_report.delivery_id,
    v_report.delivery_item_id,
    v_item.idea_id,
    v_item.inventory_id,
    v_new_inventory.idea_id,
    v_new_inventory.id,
    p_admin_user_id,
    jsonb_build_object('reason', v_report.reason, 'slot_index', v_item.slot_index)
  );

  update public.idea_box_items
  set idea_id = v_new_inventory.idea_id,
      inventory_id = v_new_inventory.id
  where id = v_item.id;

  update public.idea_inventory
  set reuse_count = greatest(reuse_count - 1, 0),
      status = case
        when status = 'retired'::public.inventory_status and greatest(reuse_count - 1, 0) < max_reuse_count then 'available'::public.inventory_status
        else status
      end
  where id = v_item.inventory_id;

  update public.idea_inventory
  set reuse_count = reuse_count + 1,
      last_assigned_at = v_now,
      status = case
        when reuse_count + 1 >= max_reuse_count then 'retired'::public.inventory_status
        else status
      end
  where id = v_new_inventory.id;

  update public.card_reports
  set status = 'replaced',
      admin_decision = 'accept_replace',
      admin_feedback = nullif(trim(coalesce(p_admin_feedback, '')), ''),
      admin_private_note = nullif(trim(coalesce(p_admin_private_note, '')), ''),
      replacement_idea_id = v_new_inventory.idea_id,
      replacement_inventory_id = v_new_inventory.id,
      reviewed_by = p_admin_user_id,
      reviewed_at = v_now,
      closed_at = v_now
  where id = v_report.id;

  insert into public.card_report_events (
    report_id,
    user_id,
    actor,
    event_type,
    metadata
  ) values (
    v_report.id,
    v_report.user_id,
    'admin',
    'card_replaced',
    jsonb_build_object('replacement_idea_id', v_new_inventory.idea_id)
  );

  return v_new_inventory.idea_id;
end;
$$;

revoke all on function public.card_payload_is_sellable(jsonb, text) from public, anon, authenticated;
revoke all on function public.idea_has_sellable_card(uuid) from public, anon, authenticated;
revoke all on function public.inventory_scope_matches_candidate(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.inventory_row_is_sellable(public.idea_inventory) from public, anon, authenticated;
revoke all on function public.available_inventory_counts(text, text) from public, anon, authenticated;
revoke all on function public.inventory_health() from public, anon, authenticated;
revoke all on function public.reserve_checkout_inventory(uuid, uuid, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.deliver_idea_box(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.replace_reported_card(uuid, uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function public.card_payload_is_sellable(jsonb, text) to service_role;
grant execute on function public.idea_has_sellable_card(uuid) to service_role;
grant execute on function public.inventory_scope_matches_candidate(uuid, uuid, uuid) to service_role;
grant execute on function public.inventory_row_is_sellable(public.idea_inventory) to service_role;
grant execute on function public.available_inventory_counts(text, text) to service_role;
grant execute on function public.inventory_health() to service_role;
grant execute on function public.reserve_checkout_inventory(uuid, uuid, text, text, text, timestamptz) to service_role;
grant execute on function public.deliver_idea_box(uuid, text, text, text, uuid) to service_role;
grant execute on function public.replace_reported_card(uuid, uuid, uuid, text, text) to service_role;

notify pgrst, 'reload schema';
