param(
  [switch]$SkipReset
)

$ErrorActionPreference = "Stop"

function Invoke-DbSql {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Sql
  )

  $dbContainer = docker ps --format "{{.Names}}" |
    Where-Object { $_ -like "supabase_db_*" } |
    Select-Object -First 1

  if (-not $dbContainer) {
    throw "Could not find a running Supabase database container. Run supabase start first."
  }

  docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c $Sql
}

if (-not $SkipReset) {
  supabase db reset
}

supabase db lint --local

$validationSql = @"
select 'training_sources' as metric, count(*)::text as value from public.viral_training_sources
union all
select 'training_examples', count(*)::text from public.viral_training_examples
union all
select 'example_features', count(*)::text from public.viral_training_example_features
union all
select 'pattern_rules', count(*)::text from public.viral_pattern_rules
union all
select 'pattern_affinities', count(*)::text from public.viral_training_pattern_affinity
union all
select 'active_compilations', count(*)::text from public.viral_training_compilations where active = true
union all
select 'empty_feature_patterns', count(*)::text from public.viral_training_example_features where cardinality(derived_pattern_ids) = 0
union all
select 'compiled_profile_config', count(*)::text from public.admin_configs where namespace = 'training.compiled_profile' and version = '2026-v1' and enabled = true
order by metric;
"@

Invoke-DbSql -Sql $validationSql

$profileSql = @"
select
  pattern_id,
  pattern_name,
  pattern_family,
  signal_weight,
  example_count
from public.training_profile_for_scope('beauty', 'instagram_reels', 8);
"@

Invoke-DbSql -Sql $profileSql