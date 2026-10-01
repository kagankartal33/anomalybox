param()

$ErrorActionPreference = "Stop"

$runId = "single_use_" + (Get-Date -Format "yyyyMMdd_HHmmss")
$userOneId = "10000000-0000-4000-8000-000000000101"
$userTwoId = "10000000-0000-4000-8000-000000000102"
$categorySlug = "single_use_test_lane"
$personaSlug = "single_use_creator_mode"
$productSlug = "single_use_test_box"
$ideaId = "10000000-0000-4000-8000-000000000201"
$inventoryId = "10000000-0000-4000-8000-000000000301"

$setupAndAssertSql = @"
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('$userOneId', 'authenticated', 'authenticated', '$runId-one@example.test', '{}'::jsonb, '{}'::jsonb, now(), now(), now()),
  ('$userTwoId', 'authenticated', 'authenticated', '$runId-two@example.test', '{}'::jsonb, '{}'::jsonb, now(), now(), now())
on conflict (id) do update set updated_at = now();

insert into public.profiles (id, display_name, role)
values
  ('$userOneId', 'Single Use Creator One', 'creator'),
  ('$userTwoId', 'Single Use Creator Two', 'creator')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.categories (slug, name, family, enabled)
values ('$categorySlug', 'Single Use Test Lane', 'test', true)
on conflict (slug) do update set enabled = true;

insert into public.creator_personas (slug, name, enabled)
values ('$personaSlug', 'Single Use Creator Mode', true)
on conflict (slug) do update set enabled = true;

insert into public.box_products (slug, name, price_usd_cents, idea_count, allocation, enabled)
values ('$productSlug', 'Single Use Test Box', 100, 1, '{"high":1}'::jsonb, true)
on conflict (slug) do update set enabled = true, allocation = excluded.allocation;

insert into public.idea_candidates (
  id, user_id, platform, format, language, locale, title, one_sentence_premise,
  core_insight, opportunity_statement, mechanism_ids, hook_options, story_beats,
  production_requirements, safety_status, perspective_prism_status, confidence_band,
  status, external_idea_id, category_id, persona_id, content_style_layers, candidate_source
) values (
  '$ideaId', '$userOneId', 'instagram_reels', 'reels_35s', 'en', 'US', 'Single Use Fixture Card',
  'A one-use delivery test premise.', 'The card must only be delivered once.',
  'Protect premium scarcity.', array['TEST']::text[], '["hook"]'::jsonb, '["hook","payoff"]'::jsonb,
  '{"equipment":["phone"]}'::jsonb, 'SAFE', 'PASS', 'HIGH', 'published', '$runId-card',
  (select id from public.categories where slug = '$categorySlug'),
  (select id from public.creator_personas where slug = '$personaSlug'),
  array['test']::text[], 'admin_direct'
)
on conflict (id) do update set status = excluded.status;

insert into public.idea_cards (idea_id, title, card)
values ('$ideaId', 'The One Slot Signal', '{"idea_summary":{"premise":"Single-use fixture"}}'::jsonb)
on conflict (idea_id) do update set title = excluded.title, card = excluded.card;

insert into public.idea_inventory (
  id, idea_id, category_id, persona_id, platform, language, internal_rank_score,
  score_band, quality_floor_passed, status, reuse_count, max_reuse_count, metadata
) values (
  '$inventoryId', '$ideaId',
  (select id from public.categories where slug = '$categorySlug'),
  (select id from public.creator_personas where slug = '$personaSlug'),
  'instagram_reels', 'en', 98, 'high', true, 'available', 0, 1, '{"test":"single_use"}'::jsonb
)
on conflict (id) do update set status = 'available', reuse_count = 0, max_reuse_count = 1;

do `$`$
declare
  v_first_delivery uuid;
  v_second_delivery uuid;
  v_first_status public.box_delivery_status;
  v_second_status public.box_delivery_status;
  v_item_count integer;
  v_reuse_count integer;
  v_inventory_status public.inventory_status;
begin
  v_first_delivery := public.deliver_idea_box('$userOneId', '$productSlug', '$categorySlug', '$personaSlug', null);
  v_second_delivery := public.deliver_idea_box('$userTwoId', '$productSlug', '$categorySlug', '$personaSlug', null);

  select status into v_first_status from public.idea_box_deliveries where id = v_first_delivery;
  select status into v_second_status from public.idea_box_deliveries where id = v_second_delivery;

  if v_first_status <> 'delivered'::public.box_delivery_status then
    raise exception 'first delivery did not complete';
  end if;

  if v_second_status <> 'needs_inventory'::public.box_delivery_status then
    raise exception 'second delivery reused the consumed card or did not report missing inventory';
  end if;

  select count(*) into v_item_count
  from public.idea_box_items
  where idea_id = '$ideaId'::uuid or inventory_id = '$inventoryId'::uuid;

  if v_item_count <> 1 then
    raise exception 'single-use card appears in % box items', v_item_count;
  end if;

  select reuse_count, status
  into v_reuse_count, v_inventory_status
  from public.idea_inventory
  where id = '$inventoryId';

  if v_reuse_count <> 1 or v_inventory_status <> 'retired'::public.inventory_status then
    raise exception 'consumed inventory was not retired';
  end if;

  begin
    insert into public.idea_box_items (delivery_id, user_id, inventory_id, idea_id, slot_index, assigned_band)
    values (v_second_delivery, '$userTwoId', '$inventoryId', '$ideaId', 1, 'high');
    raise exception 'direct duplicate idea_box_item insert was allowed';
  exception when unique_violation then
    null;
  end;
end
`$`$;
"@

$cleanupSql = @"
delete from public.idea_box_items where idea_id = '$ideaId' or inventory_id = '$inventoryId';
delete from public.idea_box_deliveries where user_id in ('$userOneId', '$userTwoId');
delete from public.idea_inventory where id = '$inventoryId';
delete from public.idea_cards where idea_id = '$ideaId';
delete from public.idea_candidates where id = '$ideaId';
delete from public.box_products where slug = '$productSlug';
delete from public.creator_personas where slug = '$personaSlug';
delete from public.categories where slug = '$categorySlug';
delete from public.profiles where id in ('$userOneId', '$userTwoId');
delete from auth.users where id in ('$userOneId', '$userTwoId');
"@

$sqlFile = Join-Path $env:TEMP "viralbox-single-use-$runId.sql"
$cleanupFile = Join-Path $env:TEMP "viralbox-single-use-cleanup-$runId.sql"

try {
  $setupAndAssertSql | Set-Content -LiteralPath $sqlFile -Encoding ascii
  Get-Content -LiteralPath $sqlFile -Raw |
    docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Single-use setup/assert SQL failed with exit code $LASTEXITCODE"
  }
  Write-Host "Single-use card delivery test passed."
} finally {
  $cleanupSql | Set-Content -LiteralPath $cleanupFile -Encoding ascii
  Get-Content -LiteralPath $cleanupFile -Raw |
    docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - | Out-Null
  Remove-Item -LiteralPath $sqlFile -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $cleanupFile -Force -ErrorAction SilentlyContinue
}