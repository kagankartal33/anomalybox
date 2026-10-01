param(
  [string]$CompileVersion = "2026-v2-dataset",
  [string]$SourceSlug = "dataset_full_training_v2",
  [string]$TrendSource = "dataset_training_v2",
  [string]$EvalPrefix = "dataset_eval",
  [string[]]$ProfileCategories = @("beauty"),
  [int]$MinObservations = 1000,
  [int]$MinDatasetExamples = 1000
)

$ErrorActionPreference = "Stop"

function Invoke-DbSql {
  param([Parameter(Mandatory = $true)][string]$Sql)

  $dbContainer = docker ps --format "{{.Names}}" |
    Where-Object { $_ -eq "supabase_db_ViralBox" } |
    Select-Object -First 1

  if (-not $dbContainer) {
    $dbContainer = docker ps --format "{{.Names}}" |
      Where-Object { $_ -like "supabase_db_*" } |
      Select-Object -First 1
  }

  if (-not $dbContainer) {
    throw "Could not find a running Supabase database container. Run supabase start first."
  }

  docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c $Sql
}

$assertSql = @"
with metrics as (
  select 'active_compile' as metric, count(*)::integer as value
  from public.viral_training_compilations
  where version = '$CompileVersion' and active = true
  union all
  select 'dataset_observations', count(*)::integer
  from public.dataset_training_observations
  union all
  select 'dataset_entities', count(*)::integer
  from public.dataset_named_entity_provenance
  union all
  select 'dataset_examples', count(*)::integer
  from public.viral_training_examples example
  join public.viral_training_sources source on source.id = example.source_id
  where source.slug = '$SourceSlug'
  union all
  select 'trend_signals', count(*)::integer
  from public.trend_signals
  where source = '$TrendSource'
  union all
  select 'eval_cases', count(*)::integer
  from public.generator_eval_cases
  where slug like '${EvalPrefix}_%'
  union all
  select 'client_grants', count(*)::integer
  from information_schema.role_table_grants
  where grantee in ('anon','authenticated')
    and table_schema = 'public'
    and table_name in ('dataset_training_observations','dataset_named_entity_provenance','dataset_category_candidates')
  union all
  select 'non_algorithmic_dataset_titles', count(*)::integer
  from public.viral_training_examples example
  join public.viral_training_sources source on source.id = example.source_id
  where source.slug = '$SourceSlug'
    and example.title !~ '^(Dataset pattern|Markdown training pattern|Notebook training signal|Book craft training signal|Cinema craft training signal|Book-Train extended training signal|Media training pattern|HF training pattern) [a-f0-9]{12}$'
  union all
  select 'creator_facing_source_leaks', count(*)::integer
  from public.viral_training_examples example
  join public.viral_training_sources source on source.id = example.source_id
  where source.slug = '$SourceSlug'
    and (
      example.title ~* '(master_training|bookcomedy|codex_comedy|x-post-generator|anna.?s archive|isbn|\\.md|\\.json|\\.db|\\.docx|\\.epub|\\.pdf|\\.azw3)'
      or example.abstracted_mechanism ~* '(master_training|bookcomedy|codex_comedy|x-post-generator|anna.?s archive|isbn|\\.md|\\.json|\\.db|\\.docx|\\.epub|\\.pdf|\\.azw3)'
      or example.reusable_pattern ~* '(master_training|bookcomedy|codex_comedy|x-post-generator|anna.?s archive|isbn|\\.md|\\.json|\\.db|\\.docx|\\.epub|\\.pdf|\\.azw3)'
    )
)
select * from metrics order by metric;
"@

$output = Invoke-DbSql -Sql $assertSql
$text = $output -join "`n"

function Get-Metric([string]$Name) {
  $line = $output | Where-Object { $_ -match "^\\s*$Name\\s+\\|" } | Select-Object -First 1
  if (-not $line) { throw "Metric not found: $Name`n$text" }
  return [int](($line -split "\\|")[1].Trim())
}

if ((Get-Metric "active_compile") -ne 1) { throw "Expected active compile $CompileVersion" }
if ((Get-Metric "dataset_observations") -lt $MinObservations) { throw "Too few dataset observations" }
if ((Get-Metric "dataset_examples") -lt $MinDatasetExamples) { throw "Too few dataset examples" }
if ((Get-Metric "client_grants") -ne 0) { throw "Dataset internal tables are exposed to anon/authenticated" }
if ((Get-Metric "non_algorithmic_dataset_titles") -ne 0) { throw "Dataset training examples include non-algorithmic titles" }
if ((Get-Metric "creator_facing_source_leaks") -ne 0) { throw "Training examples leak source names or filenames in creator-facing fields" }

foreach ($category in $ProfileCategories) {
  $profileSql = @"
select count(*) as profile_rows
from public.training_profile_for_scope('$category', 'instagram_reels', 8);
"@

  $profileOutput = Invoke-DbSql -Sql $profileSql
  if (($profileOutput -join "`n") -notmatch "\\b[1-9][0-9]*\\b") {
    throw "training_profile_for_scope returned no rows for $category"
  }
}

$text