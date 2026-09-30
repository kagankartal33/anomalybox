param()

$ErrorActionPreference = "Stop"

function Assert-True {
  param(
    [Parameter(Mandatory = $true)][bool]$Condition,
    [Parameter(Mandatory = $true)][string]$Message
  )
  if (-not $Condition) { throw $Message }
}

$runId = "card_report_{0}" -f (Get-Date -Format "yyyyMMdd_HHmmss")
$creatorId = [guid]::NewGuid().ToString()
$adminId = [guid]::NewGuid().ToString()
$categorySlug = ("test_card_report_{0}" -f (Get-Date -Format "yyyyMMddHHmmss")).ToLowerInvariant()
$personaSlug = ("test_persona_{0}" -f (Get-Date -Format "yyyyMMddHHmmss")).ToLowerInvariant()
$productSlug = ("test_box_{0}" -f (Get-Date -Format "yyyyMMddHHmmss")).ToLowerInvariant()
$deliveryId = [guid]::NewGuid().ToString()
$itemOneId = [guid]::NewGuid().ToString()
$itemTwoId = [guid]::NewGuid().ToString()
$reportId = [guid]::NewGuid().ToString()
$oldIdeaId = [guid]::NewGuid().ToString()
$existingIdeaId = [guid]::NewGuid().ToString()
$newIdeaId = [guid]::NewGuid().ToString()
$oldInvId = [guid]::NewGuid().ToString()
$existingInvId = [guid]::NewGuid().ToString()
$newInvId = [guid]::NewGuid().ToString()

$sql = @"
insert into public.profiles (id, display_name, role, plan, locale)
values
  ('$creatorId', 'Card Report Creator', 'creator', 'premium', 'en-US'),
  ('$adminId', 'Card Report Admin', 'admin', 'premium', 'en-US')
on conflict (id) do update set updated_at = now();

insert into public.categories (slug, name, family, risk_level, enabled)
values ('$categorySlug', 'Card Report Test Category', 'creator_content', 'low', true);

insert into public.creator_personas (slug, name, description, tags, enabled)
values ('$personaSlug', 'Card Report Test Mode', 'Internal test persona', array['test']::text[], true);

insert into public.box_products (slug, name, price_usd_cents, idea_count, allocation, enabled)
values ('$productSlug', 'Card Report Test Box', 50000, 2, '{"high":2}'::jsonb, true);

insert into public.idea_candidates (
  id, user_id, platform, format, language, locale, title, one_sentence_premise, mechanism_ids, hook_options,
  story_beats, production_requirements, safety_status, perspective_prism_status, confidence_band, status,
  external_idea_id, category_id, persona_id, content_style_layers, candidate_source
) values
  (
    '$oldIdeaId', '$creatorId', 'instagram_reels', 'reels_35s', 'en', 'US', 'Old test card',
    'Old card premise', array['TEST']::text[], '["hook"]'::jsonb, '["hook","proof"]'::jsonb, '{}'::jsonb,
    'SAFE', 'PASS', 'HIGH', 'published', '$runId-old',
    (select id from public.categories where slug = '$categorySlug'),
    (select id from public.creator_personas where slug = '$personaSlug'),
    array['test']::text[], 'admin_direct'
  ),
  (
    '$existingIdeaId', '$creatorId', 'instagram_reels', 'reels_35s', 'en', 'US', 'Existing box card',
    'Existing card premise', array['TEST']::text[], '["hook"]'::jsonb, '["hook","proof"]'::jsonb, '{}'::jsonb,
    'SAFE', 'PASS', 'HIGH', 'published', '$runId-existing',
    (select id from public.categories where slug = '$categorySlug'),
    (select id from public.creator_personas where slug = '$personaSlug'),
    array['test']::text[], 'admin_direct'
  ),
  (
    '$newIdeaId', '$creatorId', 'instagram_reels', 'reels_35s', 'en', 'US', 'Replacement test card',
    'Replacement card premise', array['TEST']::text[], '["hook"]'::jsonb, '["hook","proof"]'::jsonb, '{}'::jsonb,
    'SAFE', 'PASS', 'HIGH', 'published', '$runId-new',
    (select id from public.categories where slug = '$categorySlug'),
    (select id from public.creator_personas where slug = '$personaSlug'),
    array['test']::text[], 'admin_direct'
  );

insert into public.idea_cards (idea_id, title, card)
values
  ('$oldIdeaId', 'Old test card', '{"idea_summary":{"premise":"Old card"}}'::jsonb),
  ('$existingIdeaId', 'Existing box card', '{"idea_summary":{"premise":"Existing card"}}'::jsonb),
  ('$newIdeaId', 'Replacement test card', '{"idea_summary":{"premise":"Replacement card"}}'::jsonb);

insert into public.idea_inventory (
  id, idea_id, category_id, persona_id, platform, language, internal_rank_score, score_band, quality_floor_passed, status, reuse_count, max_reuse_count, metadata
) values
  ('$oldInvId', '$oldIdeaId', (select id from public.categories where slug = '$categorySlug'), (select id from public.creator_personas where slug = '$personaSlug'), 'instagram_reels', 'en', 90, 'high', true, 'available', 1, 99, '{"test":"$runId"}'::jsonb),
  ('$existingInvId', '$existingIdeaId', (select id from public.categories where slug = '$categorySlug'), (select id from public.creator_personas where slug = '$personaSlug'), 'instagram_reels', 'en', 89, 'high', true, 'available', 1, 99, '{"test":"$runId"}'::jsonb),
  ('$newInvId', '$newIdeaId', (select id from public.categories where slug = '$categorySlug'), (select id from public.creator_personas where slug = '$personaSlug'), 'instagram_reels', 'en', 95, 'high', true, 'available', 0, 99, '{"test":"$runId"}'::jsonb);

insert into public.idea_box_deliveries (
  id, user_id, box_product_id, category_id, persona_id, status, allocation, delivered_at
) values (
  '$deliveryId', '$creatorId',
  (select id from public.box_products where slug = '$productSlug'),
  (select id from public.categories where slug = '$categorySlug'),
  (select id from public.creator_personas where slug = '$personaSlug'),
  'delivered', '{"high":2}'::jsonb, now()
);

insert into public.idea_box_items (id, delivery_id, user_id, inventory_id, idea_id, slot_index, assigned_band)
values
  ('$itemOneId', '$deliveryId', '$creatorId', '$oldInvId', '$oldIdeaId', 1, 'high'),
  ('$itemTwoId', '$deliveryId', '$creatorId', '$existingInvId', '$existingIdeaId', 2, 'high');

insert into public.card_reports (
  id, user_id, delivery_id, delivery_item_id, idea_id, reason, creator_note, status
) values (
  '$reportId', '$creatorId', '$deliveryId', '$itemOneId', '$oldIdeaId', 'duplicate_or_too_similar',
  'This card overlaps too much with another card in my box.', 'under_review'
);

do `$`$
begin
  begin
    insert into public.card_reports (
      user_id, delivery_id, delivery_item_id, idea_id, reason, creator_note, status
    ) values (
      '$creatorId', '$deliveryId', '$itemOneId', '$oldIdeaId', 'too_generic', 'Second open report should fail.', 'under_review'
    );
    raise exception 'duplicate open report was allowed';
  exception when unique_violation then
    null;
  end;
end
`$`$;

do `$`$
begin
  begin
    perform public.replace_reported_card('$reportId', '$existingInvId', '$adminId', 'Trying duplicate card.', null);
    raise exception 'replacement with an existing box card was allowed';
  exception when others then
    if sqlerrm = 'replacement with an existing box card was allowed' then
      raise;
    end if;
  end;
end
`$`$;

select public.replace_reported_card(
  '$reportId',
  '$newInvId',
  '$adminId',
  'Accepted. We replaced this card with a cleaner fit for the same box lane.',
  'Internal test note'
);

do `$`$
declare
  v_item public.idea_box_items%rowtype;
  v_report public.card_reports%rowtype;
  v_old_reuse integer;
  v_new_reuse integer;
  v_audit_count integer;
begin
  select * into v_item from public.idea_box_items where id = '$itemOneId';
  if v_item.idea_id <> '$newIdeaId'::uuid or v_item.inventory_id <> '$newInvId'::uuid then
    raise exception 'delivery slot was not replaced correctly';
  end if;

  select * into v_report from public.card_reports where id = '$reportId';
  if v_report.status <> 'replaced' or v_report.admin_decision <> 'accept_replace' then
    raise exception 'report was not marked replaced';
  end if;

  select reuse_count into v_old_reuse from public.idea_inventory where id = '$oldInvId';
  select reuse_count into v_new_reuse from public.idea_inventory where id = '$newInvId';
  if v_old_reuse <> 0 or v_new_reuse <> 1 then
    raise exception 'inventory reuse counters were not adjusted';
  end if;

  select count(*) into v_audit_count from public.card_report_replacements where report_id = '$reportId';
  if v_audit_count <> 1 then
    raise exception 'replacement audit row missing';
  end if;
end
`$`$;
"@

$cleanupSql = @"
delete from public.card_report_replacements where report_id = '$reportId';
delete from public.card_report_events where report_id = '$reportId';
delete from public.card_reports where id = '$reportId' or delivery_item_id in ('$itemOneId', '$itemTwoId');
delete from public.idea_box_items where delivery_id = '$deliveryId';
delete from public.idea_box_deliveries where id = '$deliveryId';
delete from public.idea_inventory where id in ('$oldInvId', '$existingInvId', '$newInvId');
delete from public.idea_cards where idea_id in ('$oldIdeaId', '$existingIdeaId', '$newIdeaId');
delete from public.idea_candidates where id in ('$oldIdeaId', '$existingIdeaId', '$newIdeaId');
delete from public.box_products where slug = '$productSlug';
delete from public.creator_personas where slug = '$personaSlug';
delete from public.categories where slug = '$categorySlug';
delete from public.profiles where id in ('$creatorId', '$adminId');
"@

$sqlFile = Join-Path $env:TEMP "viralbox-card-report-$runId.sql"
$cleanupFile = Join-Path $env:TEMP "viralbox-card-report-cleanup-$runId.sql"

try {
  $sql | Set-Content -LiteralPath $sqlFile -Encoding ascii
  Get-Content -LiteralPath $sqlFile -Raw |
    docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - | Out-Null

  $result = (& docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -t -A -c "select status || ':' || admin_decision from public.card_reports where id = '$reportId';").Trim()
  Assert-True ($result -eq "replaced:accept_replace") "Unexpected report result: $result"
  Write-Host "Card report flow test passed. ReportId=$reportId ReplacementIdea=$newIdeaId"
} finally {
  $cleanupSql | Set-Content -LiteralPath $cleanupFile -Encoding ascii
  Get-Content -LiteralPath $cleanupFile -Raw |
    docker exec -i supabase_db_ViralBox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - | Out-Null
  Remove-Item -LiteralPath $sqlFile -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $cleanupFile -Force -ErrorAction SilentlyContinue
}