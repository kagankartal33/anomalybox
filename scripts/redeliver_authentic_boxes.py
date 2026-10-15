import subprocess

sql = """
begin;

do $$
declare
  v_user_id uuid := '3756096b-1fc1-4b3c-b471-317ff41afe15';
  v_purchase_red uuid;
  v_purchase_purple uuid;
  v_delivery_red uuid;
  v_delivery_purple uuid;
begin
  -- 1. Remove old deliveries for clean slate
  delete from public.idea_box_items where user_id = v_user_id;
  delete from public.idea_box_deliveries where user_id = v_user_id;
  delete from public.purchases where user_id = v_user_id;

  -- 2. Create Purchases records
  insert into public.purchases (
    user_id, box_product_id, provider, amount_usd_cents, currency, status, fulfillment_source, completed_at, metadata
  )
  values (
    v_user_id,
    (select id from public.box_products where slug = 'viral_box_500'),
    'admin_gift', 2900, 'usd', 'paid', 'admin_gift', now(),
    '{"box_product_slug":"viral_box_500","category_slug":"fashion","persona_slug":"fashion_trendsetter","gift":true}'::jsonb
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

  -- 3. Deliver Classic Red Box (Fashion)
  select public.deliver_idea_box(
    v_user_id,
    'viral_box_500',
    'fashion',
    'fashion_trendsetter',
    v_purchase_red
  ) into v_delivery_red;

  -- 4. Deliver Signature Purple Box (Luxury)
  select public.deliver_idea_box(
    v_user_id,
    'premium_viral_box_1000',
    'luxury',
    'luxury_editor',
    v_purchase_purple
  ) into v_delivery_purple;

  raise notice 'Delivered fresh authentic boxes: Red (%) and Purple (%)', v_delivery_red, v_delivery_purple;
end $$;

commit;
"""

res = subprocess.run(
    ['npx.cmd', 'supabase', 'db', 'query', '--linked', sql.strip().replace('\n', ' ')],
    capture_output=True,
    text=True,
    shell=True
)

print("STDOUT:", res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
