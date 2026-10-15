-- ===========================================================================
-- ANOMALY BOX: GIFT 1 CLASSIC RED + 1 SIGNATURE PURPLE BOX TO USER
-- Target User: kagankartalbabahan@outlook.com
-- ===========================================================================

begin;

do $$
declare
  v_user_id uuid;
  v_delivery_red uuid;
  v_delivery_purple uuid;
  v_purchase_red uuid;
  v_purchase_purple uuid;
begin
  -- 1. Find or create user in auth.users
  select id into v_user_id from auth.users where email = 'kagankartalbabahan@outlook.com' limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      role, aud
    )
    values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'kagankartalbabahan@outlook.com',
      crypt('KaganAnomaly2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Kagan Kartal Babahan"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  end if;

  -- 2. Upsert profile & creator profile
  insert into public.profiles (id, display_name, role)
  values (v_user_id, 'Kagan Kartal Babahan', 'creator')
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.creator_profiles (user_id, handle, niche, default_platforms)
  values (v_user_id, '@kagankartal', 'luxury, fashion & lifestyle', array['instagram_reels'])
  on conflict (user_id) do nothing;

  -- 3. Create Purchases records
  insert into public.purchases (
    user_id, box_product_id, provider, amount_usd_cents, currency, status, fulfillment_source, completed_at, metadata
  )
  values (
    v_user_id,
    (select id from public.box_products where slug = 'viral_box_500'),
    'admin_gift', 2900, 'usd', 'paid', 'admin_gift', now(),
    '{"box_product_slug":"viral_box_500","category_slug":"lifestyle","persona_slug":"relatable_lifestyle","gift":true}'::jsonb
  )
  returning id into v_purchase_red;

  insert into public.purchases (
    user_id, box_product_id, provider, amount_usd_cents, currency, status, fulfillment_source, completed_at, metadata
  )
  values (
    v_user_id,
    (select id from public.box_products where slug = 'premium_viral_box_1000'),
    'admin_gift', 5900, 'usd', 'paid', 'admin_gift', now(),
    '{"box_product_slug":"premium_viral_box_1000","category_slug":"luxury","persona_slug":"luxury_editor","gift":true}'::jsonb
  )
  returning id into v_purchase_purple;

  -- 4. Deliver Classic Red Box
  select public.deliver_idea_box(
    v_user_id,
    'viral_box_500',
    'lifestyle',
    'relatable_lifestyle',
    v_purchase_red
  ) into v_delivery_red;

  -- 5. Deliver Signature Purple Box
  select public.deliver_idea_box(
    v_user_id,
    'premium_viral_box_1000',
    'luxury',
    'luxury_editor',
    v_purchase_purple
  ) into v_delivery_purple;

  raise notice 'Delivered Classic Red (%) and Signature Purple (%) to user %', v_delivery_red, v_delivery_purple, v_user_id;
end $$;

commit;
