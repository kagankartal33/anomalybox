-- Store availability is category-primary.
-- Every enabled category already has enough band stock; persona-specific rows are sparse.
-- Prefer exact category+persona inventory, then fall back to any persona in the same category.

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
            format('insufficient %s inventory for category: needed %s, available %s', v_band::text, v_needed, v_available)
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
              failure_reason = format('insufficient %s inventory for category: needed %s, available %s', v_band::text, v_needed, v_available),
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

      -- Prefer exact persona match, then any persona in the same category.
      select inv.id, inv.idea_id
      into v_inventory_id, v_idea_id
      from public.idea_inventory inv
      where inv.category_id = v_category_id
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
      order by
        case when inv.persona_id = v_persona_id then 0 else 1 end,
        inv.internal_rank_score desc,
        inv.published_at asc
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

revoke all on function public.deliver_idea_box(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.deliver_idea_box(uuid, text, text, text, uuid) to service_role;
