-- Every delivered ViralBox card is a one-time asset.
-- Once an inventory row is assigned to any box slot, neither that inventory row
-- nor its underlying idea can ever be assigned to another slot again.

update public.idea_inventory
set
  max_reuse_count = 1,
  reuse_count = case when reuse_count > 0 then 1 else 0 end,
  status = case
    when reuse_count > 0 then 'retired'::public.inventory_status
    else status
  end;

update public.idea_inventory inv
set
  max_reuse_count = 1,
  reuse_count = 1,
  status = 'retired'::public.inventory_status,
  last_assigned_at = coalesce(inv.last_assigned_at, used.first_used_at)
from (
  select inventory_id, min(created_at) as first_used_at
  from public.idea_box_items
  group by inventory_id
) used
where used.inventory_id = inv.id;

alter table public.idea_inventory
  alter column max_reuse_count set default 1;

alter table public.idea_inventory
  drop constraint if exists idea_inventory_single_use_reuse_count_chk;

alter table public.idea_inventory
  add constraint idea_inventory_single_use_reuse_count_chk
  check (reuse_count between 0 and 1 and max_reuse_count = 1);

create unique index if not exists idea_box_items_global_idea_uidx
on public.idea_box_items(idea_id);

create unique index if not exists idea_box_items_global_inventory_uidx
on public.idea_box_items(inventory_id);

drop index if exists idea_inventory_stock_idx;
create index if not exists idea_inventory_stock_idx
on public.idea_inventory(category_id, persona_id, score_band, status, reuse_count, internal_rank_score desc)
where status = 'available'::public.inventory_status and reuse_count = 0;

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
          and inv.status = 'available'
          and inv.reuse_count = 0
          and not exists (
            select 1
            from public.idea_box_items used
            where used.idea_id = inv.idea_id
               or used.inventory_id = inv.id
          )
      ) as low_count,
      count(inv.id) filter (
        where inv.score_band = 'mid'
          and inv.status = 'available'
          and inv.reuse_count = 0
          and not exists (
            select 1
            from public.idea_box_items used
            where used.idea_id = inv.idea_id
               or used.inventory_id = inv.id
          )
      ) as mid_count,
      count(inv.id) filter (
        where inv.score_band = 'high'
          and inv.status = 'available'
          and inv.reuse_count = 0
          and not exists (
            select 1
            from public.idea_box_items used
            where used.idea_id = inv.idea_id
               or used.inventory_id = inv.id
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
    200 as low_target,
    100 as mid_target,
    100 as high_target,
    60 as low_threshold,
    30 as mid_threshold,
    30 as high_threshold,
    counts.low_count < 60
      or counts.mid_count < 30
      or counts.high_count < 30 as needs_generation
  from counts
  join public.categories c on c.id = counts.category_id
  join public.creator_personas p on p.id = counts.persona_id
  order by needs_generation desc, c.sort_order, p.sort_order, c.slug, p.slug;
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
        and inv.status = 'available'
        and inv.reuse_count = 0
        and inv.max_reuse_count = 1
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
            format('insufficient %s inventory: needed %s, available %s', v_band::text, v_needed, v_available)
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
              failure_reason = format('insufficient %s inventory: needed %s, available %s', v_band::text, v_needed, v_available),
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
        and inv.status = 'available'
        and inv.reuse_count = 0
        and inv.max_reuse_count = 1
        and not exists (
          select 1
          from public.idea_box_items used
          where used.idea_id = inv.idea_id
             or used.inventory_id = inv.id
        )
      order by inv.internal_rank_score desc, inv.published_at asc
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

revoke all on function public.inventory_health() from public, anon, authenticated;
grant execute on function public.inventory_health() to service_role;

revoke all on function public.deliver_idea_box(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.deliver_idea_box(uuid, text, text, text, uuid) to service_role;

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

  if v_new_inventory.status <> 'available'
    or v_new_inventory.quality_floor_passed is not true
    or v_new_inventory.reuse_count <> 0
    or v_new_inventory.max_reuse_count <> 1 then
    raise exception 'replacement inventory is not available';
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
  set reuse_count = 1,
      max_reuse_count = 1,
      status = 'retired'::public.inventory_status,
      last_assigned_at = coalesce(last_assigned_at, v_now)
  where id = v_item.inventory_id;

  update public.idea_inventory
  set reuse_count = 1,
      max_reuse_count = 1,
      last_assigned_at = v_now,
      status = 'retired'::public.inventory_status
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

revoke all on function public.replace_reported_card(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.replace_reported_card(uuid, uuid, uuid, text, text) to service_role;
