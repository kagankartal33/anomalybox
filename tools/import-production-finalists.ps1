param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [string]$DbContainer = "supabase_db_ViralBox",
  [int]$BatchSize = 250,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

function Invoke-DbSqlFile {
  param([Parameter(Mandatory = $true)][string]$SqlPath)
  Get-Content -LiteralPath $SqlPath -Raw | docker exec -i $DbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off
}

function ConvertTo-SqlJsonLiteral {
  param([Parameter(Mandatory = $true)][string]$Json)
  return "`$json`$" + $Json + "`$json`$"
}

if (-not (Test-Path -LiteralPath $InputPath)) {
  throw "InputPath not found: $InputPath"
}

$lines = @(Get-Content -LiteralPath $InputPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($lines.Count -eq 0) { throw "Input file has no finalist rows." }

$records = @($lines | ForEach-Object { $_ | ConvertFrom-Json })
$groups = $records | Group-Object { "$($_.category_slug)|$($_.persona_slug)" }
$invalidGroups = @()
foreach ($group in $groups) {
  $items = @($group.Group)
  $low = @($items | Where-Object { $_.score_band -eq "low" }).Count
  $mid = @($items | Where-Object { $_.score_band -eq "mid" }).Count
  $high = @($items | Where-Object { $_.score_band -eq "high" }).Count
  if ($items.Count -lt 5 -or $items.Count -gt 7 -or $low -lt 2 -or $mid -lt 1 -or $high -lt 2) {
    $invalidGroups += [pscustomobject]@{
      route = $group.Name
      cards = $items.Count
      low = $low
      mid = $mid
      high = $high
      issue = "needs 5-7 cards and minimum low:2, mid:1, high:2"
    }
  }
}

$summary = [ordered]@{
  input_path = $InputPath
  finalist_records = $records.Count
  routes = $groups.Count
  invalid_routes = $invalidGroups.Count
  apply = [bool]$Apply
}

if ($invalidGroups.Count -gt 0) {
  $summary | ConvertTo-Json -Depth 6
  $invalidGroups | Select-Object -First 25 | Format-Table -AutoSize
  throw "Finalist import validation failed."
}

if (-not $Apply) {
  $summary | ConvertTo-Json -Depth 6
  Write-Host "Dry run only. Re-run with -Apply to upsert finalists."
  return
}

$tempFiles = New-Object System.Collections.Generic.List[string]
try {
  for ($offset = 0; $offset -lt $lines.Count; $offset += $BatchSize) {
    $batch = @($lines[$offset..([Math]::Min($offset + $BatchSize - 1, $lines.Count - 1))])
    $jsonArray = "[" + ($batch -join ",") + "]"
    $jsonLiteral = ConvertTo-SqlJsonLiteral -Json $jsonArray
    $sqlPath = Join-Path $env:TEMP ("viralbox-finalist-import-{0}.sql" -f ([guid]::NewGuid().ToString("N")))
    $tempFiles.Add($sqlPath) | Out-Null

    $sql = @"
begin;

with raw as (
  select value as doc
  from jsonb_array_elements($jsonLiteral::jsonb)
),
candidate_upsert as (
  insert into public.idea_candidates (
    id,
    platform,
    format,
    language,
    locale,
    title,
    one_sentence_premise,
    core_insight,
    opportunity_statement,
    mechanism_ids,
    trend_signal_ids,
    hook_options,
    story_beats,
    comedy_remix,
    human_awareness,
    production_requirements,
    safety_status,
    perspective_prism_status,
    confidence_band,
    status,
    decision_trace,
    external_idea_id,
    category_id,
    persona_id,
    content_style_layers,
    candidate_source
  )
  select
    (doc ->> 'idea_id')::uuid,
    coalesce(doc #>> '{candidate,platform}', 'instagram_reels'),
    coalesce(doc #>> '{candidate,format}', 'reels'),
    coalesce(doc #>> '{candidate,language}', 'en'),
    coalesce(doc #>> '{candidate,locale}', 'en-US'),
    coalesce(doc #>> '{candidate,title}', doc #>> '{card,title}', 'Private creator card'),
    coalesce(doc #>> '{candidate,one_sentence_premise}', doc #>> '{card,card,idea_summary,one_sentence_premise}', 'A private creator card prepared for this lane.'),
    doc #>> '{candidate,core_insight}',
    doc #>> '{candidate,opportunity_statement}',
    coalesce(array(select jsonb_array_elements_text(coalesce(doc #> '{candidate,mechanism_ids}', '[]'::jsonb))), array[]::text[]),
    coalesce(array(select jsonb_array_elements_text(coalesce(doc #> '{candidate,trend_signal_ids}', '[]'::jsonb))), array[]::text[]),
    coalesce(doc #> '{candidate,hook_options}', '[]'::jsonb),
    coalesce(doc #> '{candidate,story_beats}', '[]'::jsonb),
    coalesce(doc #> '{candidate,comedy_remix}', '{}'::jsonb),
    coalesce(doc #> '{candidate,human_awareness}', '{}'::jsonb),
    coalesce(doc #> '{candidate,production_requirements}', '{}'::jsonb),
    coalesce(doc #>> '{candidate,safety_status}', 'SAFE')::public.safety_status,
    coalesce(doc #>> '{candidate,perspective_prism_status}', 'PASS')::public.review_decision,
    coalesce(doc #>> '{candidate,confidence_band}', 'high'),
    coalesce(doc #>> '{candidate,status}', 'published')::public.idea_status,
    coalesce(doc #> '{candidate,decision_trace}', '{}'::jsonb) || jsonb_build_object('production_finalist', true),
    coalesce(doc #>> '{candidate,external_idea_id}', doc ->> 'idea_id'),
    (select id from public.categories where slug = doc ->> 'category_slug'),
    (select id from public.creator_personas where slug = doc ->> 'persona_slug'),
    coalesce(array(select jsonb_array_elements_text(coalesce(doc #> '{candidate,content_style_layers}', doc #> '{inventory,content_style_layers}', '[]'::jsonb))), array[]::text[]),
    coalesce(doc #>> '{candidate,candidate_source}', 'admin_direct')::public.generation_source_mode
  from raw
  on conflict (id) do update set
    title = excluded.title,
    one_sentence_premise = excluded.one_sentence_premise,
    category_id = excluded.category_id,
    persona_id = excluded.persona_id,
    status = excluded.status,
    decision_trace = excluded.decision_trace,
    updated_at = now()
  returning id
),
card_upsert as (
  insert into public.idea_cards (
    idea_id,
    title,
    card,
    markdown
  )
  select
    (doc ->> 'idea_id')::uuid,
    coalesce(doc #>> '{card,title}', doc #>> '{candidate,title}', 'Private creator card'),
    coalesce(doc #> '{card,card}', '{}'::jsonb),
    nullif(doc #>> '{card,markdown}', '')
  from raw
  on conflict (idea_id) do update set
    title = excluded.title,
    card = excluded.card,
    markdown = excluded.markdown,
    updated_at = now()
  returning idea_id
)
insert into public.idea_inventory (
  idea_id,
  category_id,
  persona_id,
  platform,
  language,
  content_style_layers,
  internal_rank_score,
  score_band,
  quality_floor_passed,
  status,
  reuse_count,
  max_reuse_count,
  published_at,
  metadata
)
select
  (doc ->> 'idea_id')::uuid,
  (select id from public.categories where slug = doc ->> 'category_slug'),
  (select id from public.creator_personas where slug = doc ->> 'persona_slug'),
  coalesce(doc #>> '{candidate,platform}', 'instagram_reels'),
  coalesce(doc #>> '{candidate,language}', 'en'),
  coalesce(array(select jsonb_array_elements_text(coalesce(doc #> '{inventory,content_style_layers}', doc #> '{candidate,content_style_layers}', '[]'::jsonb))), array[]::text[]),
  coalesce((doc #>> '{inventory,internal_rank_score}')::numeric, (doc #>> '{quality,editorial_quality_score}')::numeric, 80),
  (doc ->> 'score_band')::public.score_band,
  true,
  'available'::public.inventory_status,
  0,
  greatest(coalesce((doc #>> '{inventory,max_reuse_count}')::integer, 1), 1),
  now(),
  coalesce(doc #> '{inventory,metadata}', '{}'::jsonb) || jsonb_build_object(
    'production_finalist', true,
    'source_inventory_id', doc ->> 'source_inventory_id',
    'finalist_rank', (doc ->> 'rank')::integer,
    'creator_visible_scores', false
  )
from raw
on conflict (idea_id) do update set
  category_id = excluded.category_id,
  persona_id = excluded.persona_id,
  platform = excluded.platform,
  language = excluded.language,
  content_style_layers = excluded.content_style_layers,
  internal_rank_score = excluded.internal_rank_score,
  score_band = excluded.score_band,
  quality_floor_passed = excluded.quality_floor_passed,
  status = excluded.status,
  max_reuse_count = excluded.max_reuse_count,
  metadata = excluded.metadata,
  updated_at = now();

commit;
"@

    Set-Content -LiteralPath $sqlPath -Value $sql -Encoding utf8
    Invoke-DbSqlFile -SqlPath $sqlPath
  }
} finally {
  foreach ($path in $tempFiles) {
    if (Test-Path -LiteralPath $path) {
      Remove-Item -LiteralPath $path -Force
    }
  }
}

$summary | ConvertTo-Json -Depth 6