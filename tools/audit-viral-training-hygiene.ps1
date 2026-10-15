param(
  [string]$CompileVersion = "",
  [double]$MaxEmptyPatternRate = 0.05
)

$ErrorActionPreference = "Stop"

function Get-DbContainer {
  $db = docker ps --format "{{.Names}}" | Where-Object { $_ -eq "supabase_db_ViralBox" } | Select-Object -First 1
  if (-not $db) {
    $db = docker ps --format "{{.Names}}" | Where-Object { $_ -like "supabase_db_*" } | Select-Object -First 1
  }
  if (-not $db) { throw "Supabase DB container not running" }
  return $db
}

$db = Get-DbContainer
if (-not $CompileVersion) {
  $CompileVersion = (docker exec -i $db psql -U postgres -d postgres -t -A -c "select version from public.viral_training_compilations where active = true order by created_at desc limit 1;").Trim()
  if (-not $CompileVersion) { $CompileVersion = "unknown" }
  Write-Host "Using active compile version: $CompileVersion"
}
$sql = @"
select 'examples' as metric, count(*)::text as value from public.viral_training_examples
union all
select 'features', count(*)::text from public.viral_training_example_features
union all
select 'empty_patterns', count(*)::text from public.viral_training_example_features where cardinality(derived_pattern_ids) = 0
union all
select 'restricted_examples', count(*)::text from public.viral_training_examples where risk_level = 'restricted'
union all
select 'high_copy_risk', count(*)::text from public.viral_training_examples where copy_risk = 'high'
union all
select 'active_compilations', count(*)::text from public.viral_training_compilations where active = true
union all
select 'compiled_profile', count(*)::text from public.admin_configs where namespace = 'training.compiled_profile' and version = '$CompileVersion' and enabled = true
order by metric;
"@

$raw = docker exec -i $db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -A -F "`t" -c $sql
Write-Host $raw

$map = @{}
foreach ($line in ($raw -split "`n")) {
  if ($line -match "^(metric|examples|features|empty_patterns|restricted_examples|high_copy_risk|active_compilations|compiled_profile)\t") {
    $parts = $line.Trim() -split "`t"
    if ($parts.Count -ge 2 -and $parts[0] -ne "metric") { $map[$parts[0]] = [double]$parts[1] }
  }
}

$features = if ($map.ContainsKey("features")) { $map["features"] } else { 0 }
$empty = if ($map.ContainsKey("empty_patterns")) { $map["empty_patterns"] } else { 0 }
$rate = if ($features -gt 0) { $empty / $features } else { 0 }

$fail = $false
if ($rate -gt $MaxEmptyPatternRate) {
  Write-Host "FAIL empty_pattern_rate=$rate > $MaxEmptyPatternRate"
  $fail = $true
} else {
  Write-Host "OK empty_pattern_rate=$rate"
}

if ($map.ContainsKey("compiled_profile") -and $map["compiled_profile"] -lt 1) {
  Write-Host "WARN compiled_profile version $CompileVersion not enabled yet"
}

if ($fail) { exit 2 }
Write-Host "HYGIENE_PASS"
exit 0
