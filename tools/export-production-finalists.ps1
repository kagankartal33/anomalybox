param(
  [int]$TargetCardsPerCategory = 7,
  [int]$MinimumCardsPerCategory = 5,
  [string]$CategorySlugs = "",
  [int]$LimitCategories = 0,
  [string]$OutputRoot = "production_exports",
  [string]$DbContainer = "supabase_db_ViralBox",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Invoke-DbSql {
  param([Parameter(Mandatory = $true)][string]$Sql)
  docker exec -i $DbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -t -A -c $Sql
}

function ConvertTo-SqlLiteral {
  param([Parameter(Mandatory = $true)][string]$Value)
  return "'" + ($Value -replace "'", "''") + "'"
}

function Get-PersonaForCategory {
  param([Parameter(Mandatory = $true)][string]$Slug, [string]$Family = "", [string]$Name = "")
  $haystack = ("$Slug $Family $Name").ToLowerInvariant()
  $has = { param([string[]]$Needles) foreach ($needle in $Needles) { if ($haystack.Contains($needle)) { return $true } } return $false }

  if (& $has @("beauty", "skincare", "makeup", "cosmetic", "salon", "spa", "nail", "hair", "lashes", "brow")) { return "beauty_tester" }
  if (& $has @("fashion", "clothing", "jewelry", "boutique", "luxury", "watch", "shoe", "style", "outfit", "apparel")) { return "style_strategist" }
  if (& $has @("food", "restaurant", "cafe", "coffee", "bar", "bakery", "dessert", "recipe", "chef", "pizza", "burger", "tea", "wine", "dining")) { return "food_experience_maker" }
  if (& $has @("travel", "hotel", "tour", "tourism", "resort", "city", "museum", "park", "venue", "stadium", "arena", "plaza", "garden", "mall", "pool", "rink", "field", "ground", "zoo", "aquarium", "film", "cinema", "visual")) { return "cinematic_storyteller" }
  if (& $has @("sport", "fitness", "gym", "athlete", "training", "martial", "yoga", "pilates", "dance", "motoring", "car", "auto", "motorcycle", "outdoor", "performance")) { return "performance_athlete" }
  if (& $has @("gaming", "game", "stream", "live", "fandom", "community", "esports", "fan club")) { return "live_community_host" }
  if (& $has @("art", "artist", "music", "design", "photo", "gallery", "creative", "craft", "theater", "theatre")) { return "artist_worldbuilder" }
  if (& $has @("tech", "science", "ai", "software", "computer", "electronics", "data", "security", "privacy", "engineer")) { return "science_tech_explainer" }
  if (& $has @("business", "startup", "founder", "operator", "career", "sales", "marketing", "entrepreneur", "leadership", "consultant")) { return "founder_operator" }
  if (& $has @("education", "school", "course", "book", "author", "teacher", "learning")) { return "science_tech_explainer" }
  if (& $has @("content", "creator", "social", "influencer")) { return "creator_teacher" }
  if (& $has @("product", "commerce", "shop", "store", "retail", "affiliate")) { return "product_reviewer" }
  if (& $has @("comedy", "entertainment", "meme")) { return "comedy_observer" }
  if ($Family -eq "instagram_business") { return "expert_guide" }
  return "relatable_lifestyle"
}

function Get-Categories {
  $where = "enabled = true"
  $normalizedSlugs = @(([string]$CategorySlugs).Split(",", [System.StringSplitOptions]::RemoveEmptyEntries) | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  if ($normalizedSlugs.Count -gt 0) {
    $quoted = ($normalizedSlugs | ForEach-Object { ConvertTo-SqlLiteral $_ }) -join ","
    $where = "$where and slug in ($quoted)"
  }
  $limit = if ($LimitCategories -gt 0) { " limit $LimitCategories" } else { "" }
  $rows = Invoke-DbSql -Sql "select slug, name, family from public.categories where $where order by sort_order, slug$limit;"
  return @($rows | Where-Object { $_ } | ForEach-Object {
    $parts = $_ -split "\|", 3
    if ($parts.Count -lt 3) { $parts = $_ -split "`t", 3 }
    [pscustomobject]@{ slug = $parts[0]; name = $parts[1]; family = $parts[2] }
  })
}

function Get-FinalistRows {
  param(
    [Parameter(Mandatory = $true)][string]$CategorySlug,
    [Parameter(Mandatory = $true)][string]$PersonaSlug
  )

  $safeCategory = ConvertTo-SqlLiteral $CategorySlug
  $safePersona = ConvertTo-SqlLiteral $PersonaSlug
  $target = [Math]::Max($TargetCardsPerCategory, $MinimumCardsPerCategory)

  $sql = @"
with pool as (
  select
    inv.id as inventory_id,
    inv.idea_id,
    c.slug as category_slug,
    c.name as category_name,
    p.slug as persona_slug,
    p.name as persona_name,
    inv.score_band::text as score_band,
    inv.internal_rank_score,
    inv.max_reuse_count,
    inv.content_style_layers as inventory_content_style_layers,
    inv.metadata as inventory_metadata,
    cand.platform,
    cand.format,
    cand.language,
    cand.locale,
    cand.title,
    cand.one_sentence_premise,
    cand.core_insight,
    cand.opportunity_statement,
    cand.mechanism_ids,
    cand.trend_signal_ids,
    cand.hook_options,
    cand.story_beats,
    cand.comedy_remix,
    cand.human_awareness,
    cand.production_requirements,
    cand.safety_status::text as safety_status,
    cand.perspective_prism_status::text as perspective_prism_status,
    cand.confidence_band,
    cand.status::text as candidate_status,
    cand.decision_trace,
    cand.external_idea_id,
    cand.content_style_layers as candidate_content_style_layers,
    cand.candidate_source::text as candidate_source,
    card.title as card_title,
    card.card,
    card.markdown,
    coalesce(qc.editorial_quality_score, 0) as editorial_quality_score,
    coalesce(qc.creator_fit_score, 0) as creator_fit_score,
    coalesce(qc.platform_fit_score, 0) as platform_fit_score,
    coalesce(qc.brand_safety_score, 0) as brand_safety_score,
    coalesce(qc.premium_completeness_score, 0) as premium_completeness_score,
    coalesce(qc.semantic_duplicate_score, 0) as semantic_duplicate_score
  from public.idea_inventory inv
  join public.categories c on c.id = inv.category_id
  join public.creator_personas p on p.id = inv.persona_id
  join public.idea_candidates cand on cand.id = inv.idea_id
  join public.idea_cards card on card.idea_id = inv.idea_id
  left join public.idea_quality_checks qc on qc.idea_id = inv.idea_id
  where c.slug = $safeCategory
    and p.slug = $safePersona
    and inv.status = 'available'
    and inv.quality_floor_passed = true
    and coalesce(qc.decision::text, 'approve') = 'approve'
),
ranked as (
  select
    *,
    row_number() over (
      partition by score_band
      order by editorial_quality_score desc, creator_fit_score desc, platform_fit_score desc, brand_safety_score desc, semantic_duplicate_score asc, internal_rank_score desc, idea_id
    ) as band_rank,
    row_number() over (
      order by editorial_quality_score desc, creator_fit_score desc, platform_fit_score desc, brand_safety_score desc, semantic_duplicate_score asc, internal_rank_score desc, idea_id
    ) as overall_rank
  from pool
),
required as (
  select * from ranked
  where (score_band = 'low' and band_rank <= 2)
     or (score_band = 'mid' and band_rank <= 1)
     or (score_band = 'high' and band_rank <= 2)
),
fill as (
  select ranked.*
  from ranked
  where not exists (select 1 from required where required.inventory_id = ranked.inventory_id)
  order by editorial_quality_score desc, creator_fit_score desc, platform_fit_score desc, brand_safety_score desc, semantic_duplicate_score asc, internal_rank_score desc, idea_id
  limit greatest(0, $target - (select count(*) from required))
),
selected as (
  select * from required
  union all
  select * from fill
)
select jsonb_build_object(
  'category_slug', category_slug,
  'category_name', category_name,
  'persona_slug', persona_slug,
  'persona_name', persona_name,
  'idea_id', idea_id,
  'source_inventory_id', inventory_id,
  'score_band', score_band,
  'rank', row_number() over (order by editorial_quality_score desc, creator_fit_score desc, platform_fit_score desc, brand_safety_score desc, semantic_duplicate_score asc, internal_rank_score desc, idea_id),
  'quality', jsonb_build_object(
    'editorial_quality_score', editorial_quality_score,
    'creator_fit_score', creator_fit_score,
    'platform_fit_score', platform_fit_score,
    'brand_safety_score', brand_safety_score,
    'premium_completeness_score', premium_completeness_score,
    'semantic_duplicate_score', semantic_duplicate_score
  ),
  'candidate', jsonb_build_object(
    'platform', platform,
    'format', format,
    'language', language,
    'locale', locale,
    'title', title,
    'one_sentence_premise', one_sentence_premise,
    'core_insight', core_insight,
    'opportunity_statement', opportunity_statement,
    'mechanism_ids', mechanism_ids,
    'trend_signal_ids', trend_signal_ids,
    'hook_options', hook_options,
    'story_beats', story_beats,
    'comedy_remix', comedy_remix,
    'human_awareness', human_awareness,
    'production_requirements', production_requirements,
    'safety_status', safety_status,
    'perspective_prism_status', perspective_prism_status,
    'confidence_band', confidence_band,
    'status', candidate_status,
    'decision_trace', decision_trace,
    'external_idea_id', external_idea_id,
    'content_style_layers', candidate_content_style_layers,
    'candidate_source', candidate_source
  ),
  'card', jsonb_build_object(
    'title', card_title,
    'card', card,
    'markdown', markdown
  ),
  'inventory', jsonb_build_object(
    'content_style_layers', inventory_content_style_layers,
    'internal_rank_score', internal_rank_score,
    'score_band', score_band,
    'max_reuse_count', max_reuse_count,
    'metadata', inventory_metadata
  )
)::text
from selected
order by editorial_quality_score desc, creator_fit_score desc, platform_fit_score desc, brand_safety_score desc, semantic_duplicate_score asc, internal_rank_score desc, idea_id;
"@

  return @(Invoke-DbSql -Sql $sql | Where-Object { $_ })
}

if ($MinimumCardsPerCategory -lt 5) { throw "MinimumCardsPerCategory must be at least 5 for SIGNATURE PURPLE BOX delivery compatibility." }
if ($TargetCardsPerCategory -lt $MinimumCardsPerCategory) { throw "TargetCardsPerCategory must be >= MinimumCardsPerCategory." }

$categories = @(Get-Categories)
if ($categories.Count -eq 0) { throw "No enabled categories found." }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$exportDir = Join-Path $OutputRoot "mvp_finalists_$timestamp"
$records = New-Object System.Collections.Generic.List[string]
$missing = New-Object System.Collections.Generic.List[object]
$routeSummaries = New-Object System.Collections.Generic.List[object]

foreach ($category in $categories) {
  $persona = Get-PersonaForCategory -Slug $category.slug -Family $category.family -Name $category.name
  $rows = @(Get-FinalistRows -CategorySlug $category.slug -PersonaSlug $persona)
  $low = 0; $mid = 0; $high = 0
  foreach ($row in $rows) {
    if ($row -match '"score_band"\s*:\s*"low"') { $low += 1 }
    if ($row -match '"score_band"\s*:\s*"mid"') { $mid += 1 }
    if ($row -match '"score_band"\s*:\s*"high"') { $high += 1 }
  }

  $ok = $rows.Count -ge $MinimumCardsPerCategory -and $low -ge 2 -and $mid -ge 1 -and $high -ge 2
  $routeSummaries.Add([pscustomobject]@{
    category_slug = $category.slug
    persona_slug = $persona
    finalist_count = $rows.Count
    low = $low
    mid = $mid
    high = $high
    ready_for_signature_purple = $ok
  }) | Out-Null

  if ($ok) {
    foreach ($row in $rows) { $records.Add($row) | Out-Null }
  } else {
    $missing.Add([pscustomobject]@{
      category_slug = $category.slug
      category_name = $category.name
      persona_slug = $persona
      finalist_count = $rows.Count
      low = $low
      mid = $mid
      high = $high
      reason = "needs at least 5 cards with minimum low:2, mid:1, high:2"
    }) | Out-Null
  }
}

$readyRoutes = @($routeSummaries | Where-Object { $_.ready_for_signature_purple }).Count
$summary = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  target_cards_per_category = $TargetCardsPerCategory
  minimum_cards_per_category = $MinimumCardsPerCategory
  categories_scanned = $categories.Count
  ready_routes = $readyRoutes
  missing_routes = $missing.Count
  finalist_records = $records.Count
  output_dir = $exportDir
}

if ($DryRun) {
  $summary | ConvertTo-Json -Depth 8
  $missing | Select-Object -First 25 | Format-Table -AutoSize
  return
}

New-Item -ItemType Directory -Force -Path $exportDir | Out-Null
$manifestPath = Join-Path $exportDir "manifest.json"
$recordsPath = Join-Path $exportDir "finalist_cards.jsonl"
$missingPath = Join-Path $exportDir "missing_routes.jsonl"
$summaryPath = Join-Path $exportDir "route_summary.json"

$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
$records | Set-Content -LiteralPath $recordsPath -Encoding utf8
($missing | ForEach-Object { $_ | ConvertTo-Json -Compress }) | Set-Content -LiteralPath $missingPath -Encoding utf8
$routeSummaries | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $summaryPath -Encoding utf8

$summary | ConvertTo-Json -Depth 8