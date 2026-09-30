-- Production checkout hardening.
-- This migration is intentionally additive: it does not seed or modify card content.

create table if not exists public.checkout_inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  checkout_session_id uuid not null references public.checkout_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  inventory_id uuid not null references public.idea_inventory(id) on delete restrict,
  idea_id uuid not null references public.idea_candidates(id) on delete restrict,
  assigned_band public.score_band not null,
  slot_index integer not null check (slot_index > 0),
  status text not null default 'active' check (status in ('active', 'consumed', 'released')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checkout_session_id, slot_index)
);

create unique index if not exists checkout_reservations_active_inventory_uidx
on public.checkout_inventory_reservations(inventory_id)
where status = 'active';

create unique index if not exists checkout_reservations_active_idea_uidx
on public.checkout_inventory_reservations(idea_id)
where status = 'active';

create index if not exists checkout_reservations_checkout_status_idx
on public.checkout_inventory_reservations(checkout_session_id, status, slot_index);

create index if not exists checkout_reservations_expiry_idx
on public.checkout_inventory_reservations(expires_at)
where status = 'active';

alter table public.checkout_inventory_reservations enable row level security;
revoke all on public.checkout_inventory_reservations from public, anon, authenticated;
grant all on public.checkout_inventory_reservations to service_role;

alter table public.stripe_webhook_events
  add column if not exists attempt_count integer not null default 1,
  add column if not exists last_attempt_at timestamptz not null default now();

alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_dedupe_key_uidx
on public.notifications(dedupe_key)
where dedupe_key is not null;

create or replace function public.release_expired_checkout_inventory()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_released integer;
begin
  -- Keep a grace window for a paid Checkout webhook that is still in flight.
  update public.checkout_inventory_reservations r
  set status = 'released',
      released_at = now(),
      updated_at = now()
  from public.checkout_sessions c
  where r.checkout_session_id = c.id
    and r.status = 'active'
    and r.expires_at < now() - interval '15 minutes'
    and c.status in ('created', 'open', 'expired', 'canceled');

  get diagnostics v_released = row_count;
  return v_released;
end;
$$;

create or replace function public.release_checkout_inventory(p_checkout_session_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_released integer;
begin
  update public.checkout_inventory_reservations
  set status = 'released',
      released_at = now(),
      updated_at = now()
  where checkout_session_id = p_checkout_session_id
    and status = 'active';

  get diagnostics v_released = row_count;
  return v_released;
end;
$$;

create or replace function public.available_inventory_counts(p_category_slug text)
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
  where c.slug = p_category_slug
    and c.enabled = true
    and inv.status = 'available'
    and inv.reuse_count = 0
    and inv.max_reuse_count = 1
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
  v_loop_index integer;
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
        and inv.score_band = v_band
        and inv.status = 'available'
        and inv.reuse_count = 0
        and inv.max_reuse_count = 1
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
        case when inv.persona_id = v_persona_id then 0 else 1 end,
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

create or replace function public.fulfill_reserved_checkout(
  p_checkout_session_id uuid,
  p_purchase_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_checkout public.checkout_sessions%rowtype;
  v_purchase public.purchases%rowtype;
  v_product public.box_products%rowtype;
  v_delivery_id uuid;
  v_existing_status public.box_delivery_status;
  v_reservation record;
  v_reserved_count integer;
  v_updated integer;
begin
  select *
  into v_checkout
  from public.checkout_sessions
  where id = p_checkout_session_id
  for update;

  if not found then
    raise exception 'checkout session not found';
  end if;

  select *
  into v_purchase
  from public.purchases
  where id = p_purchase_id
  for update;

  if not found
     or v_purchase.user_id <> v_checkout.user_id
     or v_purchase.box_product_id <> v_checkout.box_product_id
     or v_purchase.status <> 'paid' then
    raise exception 'paid purchase does not match checkout';
  end if;

  select id, status
  into v_delivery_id, v_existing_status
  from public.idea_box_deliveries
  where purchase_id = p_purchase_id
  for update;

  if v_delivery_id is not null and v_existing_status = 'delivered' then
    return v_delivery_id;
  end if;

  select *
  into v_product
  from public.box_products
  where id = v_checkout.box_product_id;

  select count(*)::integer
  into v_reserved_count
  from public.checkout_inventory_reservations
  where checkout_session_id = p_checkout_session_id
    and status = 'active';

  if v_reserved_count <> v_product.idea_count then
    raise exception 'complete active reservation not found';
  end if;

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
      v_checkout.user_id,
      p_purchase_id,
      v_checkout.box_product_id,
      v_checkout.category_id,
      v_checkout.persona_id,
      'pending',
      v_product.allocation
    )
    returning id into v_delivery_id;
  else
    update public.idea_box_deliveries
    set status = 'pending',
        failure_reason = null,
        delivered_at = null
    where id = v_delivery_id;

    delete from public.idea_box_items where delivery_id = v_delivery_id;
  end if;

  for v_reservation in
    select *
    from public.checkout_inventory_reservations
    where checkout_session_id = p_checkout_session_id
      and status = 'active'
    order by slot_index
    for update
  loop
    update public.idea_inventory
    set reuse_count = 1,
        max_reuse_count = 1,
        last_assigned_at = now(),
        status = 'retired'::public.inventory_status
    where id = v_reservation.inventory_id
      and idea_id = v_reservation.idea_id
      and status = 'available'
      and reuse_count = 0
      and max_reuse_count = 1;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'reserved inventory is no longer available';
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
      v_checkout.user_id,
      v_reservation.inventory_id,
      v_reservation.idea_id,
      v_reservation.slot_index,
      v_reservation.assigned_band
    );
  end loop;

  update public.checkout_inventory_reservations
  set status = 'consumed',
      consumed_at = now(),
      updated_at = now()
  where checkout_session_id = p_checkout_session_id
    and status = 'active';

  update public.idea_box_deliveries
  set status = 'delivered',
      delivered_at = now(),
      failure_reason = null
  where id = v_delivery_id;

  update public.checkout_sessions
  set purchase_id = p_purchase_id,
      status = 'paid'
  where id = p_checkout_session_id;

  return v_delivery_id;
end;
$$;

create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.stripe_webhook_events%rowtype;
begin
  insert into public.stripe_webhook_events (
    id,
    event_type,
    payload,
    processing_status,
    attempt_count,
    last_attempt_at
  ) values (
    p_event_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb),
    'processing',
    1,
    now()
  )
  on conflict (id) do nothing;

  if found then
    return 'claimed';
  end if;

  select *
  into v_event
  from public.stripe_webhook_events
  where id = p_event_id
  for update;

  if v_event.processing_status = 'processed' then
    return 'processed';
  end if;

  if v_event.processing_status = 'processing'
     and v_event.last_attempt_at > now() - interval '5 minutes' then
    return 'busy';
  end if;

  update public.stripe_webhook_events
  set event_type = p_event_type,
      payload = coalesce(p_payload, '{}'::jsonb),
      processing_status = 'processing',
      attempt_count = attempt_count + 1,
      last_attempt_at = now(),
      error_message = null
  where id = p_event_id;

  return 'claimed';
end;
$$;

revoke all on function public.release_expired_checkout_inventory() from public, anon, authenticated;
revoke all on function public.release_checkout_inventory(uuid) from public, anon, authenticated;
revoke all on function public.available_inventory_counts(text) from public, anon, authenticated;
revoke all on function public.reserve_checkout_inventory(uuid, uuid, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.fulfill_reserved_checkout(uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_stripe_webhook_event(text, text, jsonb) from public, anon, authenticated;

grant execute on function public.release_expired_checkout_inventory() to service_role;
grant execute on function public.release_checkout_inventory(uuid) to service_role;
grant execute on function public.available_inventory_counts(text) to service_role;
grant execute on function public.reserve_checkout_inventory(uuid, uuid, text, text, text, timestamptz) to service_role;
grant execute on function public.fulfill_reserved_checkout(uuid, uuid) to service_role;
grant execute on function public.claim_stripe_webhook_event(text, text, jsonb) to service_role;