\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_user_id uuid;
  v_product public.box_products%rowtype;
  v_category_id uuid;
  v_category_slug text;
  v_persona_id uuid;
  v_persona_slug text;
  v_checkout_one uuid;
  v_checkout_two uuid;
  v_purchase_id uuid;
  v_delivery_id uuid;
  v_reserved integer;
  v_item_count integer;
  v_consumed_count integer;
  v_overlap_count integer;
  v_claim text;
begin
  select id into v_user_id from public.profiles order by created_at limit 1;
  select * into v_product from public.box_products where enabled order by idea_count limit 1;
  select id, slug into v_category_id, v_category_slug from public.categories where enabled order by sort_order, slug limit 1;
  select id, slug into v_persona_id, v_persona_slug from public.creator_personas where enabled order by sort_order, slug limit 1;

  if v_user_id is null or v_product.id is null or v_category_id is null or v_persona_id is null then
    raise exception 'local test fixtures are incomplete';
  end if;

  insert into public.checkout_sessions (
    user_id, box_product_id, category_id, persona_id, provider, provider_session_id, status, metadata
  ) values (
    v_user_id, v_product.id, v_category_id, v_persona_id, 'stripe',
    'cs_test_reservation_contract_one', 'created', '{"reservation_required":true}'::jsonb
  ) returning id into v_checkout_one;

  v_reserved := public.reserve_checkout_inventory(
    v_checkout_one,
    v_user_id,
    v_product.slug,
    v_category_slug,
    v_persona_slug,
    now() + interval '31 minutes'
  );

  if v_reserved <> v_product.idea_count then
    raise exception 'reservation count mismatch: expected %, received %', v_product.idea_count, v_reserved;
  end if;

  if public.reserve_checkout_inventory(
    v_checkout_one,
    v_user_id,
    v_product.slug,
    v_category_slug,
    v_persona_slug,
    now() + interval '31 minutes'
  ) <> v_product.idea_count then
    raise exception 'reservation retry was not idempotent';
  end if;

  insert into public.purchases (
    user_id,
    box_product_id,
    category_id,
    persona_id,
    provider,
    provider_checkout_session_id,
    amount_usd_cents,
    currency,
    status,
    fulfillment_source,
    completed_at
  ) values (
    v_user_id,
    v_product.id,
    v_category_id,
    v_persona_id,
    'stripe',
    'cs_test_reservation_contract_one',
    v_product.price_usd_cents,
    'usd',
    'paid',
    'stripe',
    now()
  ) returning id into v_purchase_id;

  v_delivery_id := public.fulfill_reserved_checkout(v_checkout_one, v_purchase_id);

  select count(*)::integer
  into v_item_count
  from public.idea_box_items
  where delivery_id = v_delivery_id;

  if v_item_count <> v_product.idea_count then
    raise exception 'delivery item count mismatch';
  end if;

  select count(*)::integer
  into v_consumed_count
  from public.checkout_inventory_reservations
  where checkout_session_id = v_checkout_one
    and status = 'consumed';

  if v_consumed_count <> v_product.idea_count then
    raise exception 'reservation was not consumed';
  end if;

  if exists (
    select 1
    from public.idea_box_items item
    join public.idea_inventory inv on inv.id = item.inventory_id
    where item.delivery_id = v_delivery_id
      and (inv.status <> 'retired' or inv.reuse_count <> 1 or inv.max_reuse_count <> 1)
  ) then
    raise exception 'delivered inventory was not retired exactly once';
  end if;

  insert into public.checkout_sessions (
    user_id, box_product_id, category_id, persona_id, provider, provider_session_id, status, metadata
  ) values (
    v_user_id, v_product.id, v_category_id, v_persona_id, 'stripe',
    'cs_test_reservation_contract_two', 'created', '{"reservation_required":true}'::jsonb
  ) returning id into v_checkout_two;

  perform public.reserve_checkout_inventory(
    v_checkout_two,
    v_user_id,
    v_product.slug,
    v_category_slug,
    v_persona_slug,
    now() + interval '31 minutes'
  );

  select count(*)::integer
  into v_overlap_count
  from public.checkout_inventory_reservations first_reservation
  join public.checkout_inventory_reservations second_reservation
    on first_reservation.inventory_id = second_reservation.inventory_id
    or first_reservation.idea_id = second_reservation.idea_id
  where first_reservation.checkout_session_id = v_checkout_one
    and second_reservation.checkout_session_id = v_checkout_two;

  if v_overlap_count <> 0 then
    raise exception 'inventory was reused across checkouts';
  end if;

  v_claim := public.claim_stripe_webhook_event(
    'evt_reservation_contract',
    'checkout.session.completed',
    '{}'::jsonb
  );
  if v_claim <> 'claimed' then raise exception 'new webhook event was not claimed'; end if;

  v_claim := public.claim_stripe_webhook_event(
    'evt_reservation_contract',
    'checkout.session.completed',
    '{}'::jsonb
  );
  if v_claim <> 'busy' then raise exception 'concurrent webhook event was not marked busy'; end if;

  update public.stripe_webhook_events
  set processing_status = 'failed'
  where id = 'evt_reservation_contract';

  v_claim := public.claim_stripe_webhook_event(
    'evt_reservation_contract',
    'checkout.session.completed',
    '{}'::jsonb
  );
  if v_claim <> 'claimed' then raise exception 'failed webhook event could not be reclaimed'; end if;

  update public.stripe_webhook_events
  set processing_status = 'processed'
  where id = 'evt_reservation_contract';

  v_claim := public.claim_stripe_webhook_event(
    'evt_reservation_contract',
    'checkout.session.completed',
    '{}'::jsonb
  );
  if v_claim <> 'processed' then raise exception 'processed webhook event was not idempotent'; end if;

  raise notice 'checkout reservation and webhook recovery contract passed';
end;
$test$;

rollback;