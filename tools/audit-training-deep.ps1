<#
.SYNOPSIS
Deep audit of viral training corpus + active compiled profile.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\tools\audit-training-deep.ps1
powershell -ExecutionPolicy Bypass -File .\tools\audit-training-deep.ps1 -CompileVersion 2026-v10-6h-secure -OutDir docs/training
#>
param(
  [string]$CompileVersion = "",
  [string]$OutDir = "",
  [double]$MaxEmptyPatternRate = 0.05,
  [double]$MaxRestrictedRate = 0.02
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
if (-not $OutDir) {
  $runHint = Join-Path $env:TEMP "viralbox_idea_v11_run_dir.txt"
  if (-not (Test-Path $runHint)) {
    $runHint = Join-Path $env:TEMP "viralbox_6h_run_dir.txt"
  }
  if (Test-Path $runHint) {
    $OutDir = (Get-Content $runHint -Raw).Trim()
  } else {
    $OutDir = Join-Path $repoRoot "docs\training"
  }
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Get-DbContainer {
  $db = docker ps --format "{{.Names}}" | Where-Object { $_ -eq "supabase_db_ViralBox" } | Select-Object -First 1
  if (-not $db) {
    $db = docker ps --format "{{.Names}}" | Where-Object { $_ -like "supabase_db_*" } | Select-Object -First 1
  }
  if (-not $db) { throw "Supabase DB container not running" }
  return $db
}

if (-not $CompileVersion) {
  $dbProbe = Get-DbContainer
  $CompileVersion = (docker exec -i $dbProbe psql -U postgres -d postgres -t -A -c "select version from public.viral_training_compilations where active = true order by created_at desc limit 1;").Trim()
  if (-not $CompileVersion) { $CompileVersion = "unknown" }
  Write-Host "Using active compile version: $CompileVersion"
}

function Invoke-SqlA {
  param([string]$Sql)
  $db = Get-DbContainer
  return (docker exec -i $db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -A -F "`t" -t -c $Sql)
}

function Invoke-SqlTable {
  param([string]$Sql)
  $db = Get-DbContainer
  return (docker exec -i $db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c $Sql)
}

function Get-MetricMap {
  param([string]$Sql)
  $raw = Invoke-SqlA $Sql
  $map = @{}
  foreach ($line in ($raw -split "`n")) {
    $line = $line.Trim()
    if (-not $line) { continue }
    $parts = $line -split "`t"
    if ($parts.Count -ge 2 -and $parts[0] -ne "metric") {
      $map[$parts[0]] = $parts[1]
    }
  }
  return $map
}

$coreSql = @"
select 'examples' as metric, count(*)::text as value from public.viral_training_examples
union all select 'features', count(*)::text from public.viral_training_example_features
union all select 'affinity', count(*)::text from public.viral_training_pattern_affinity
union all select 'empty_patterns', count(*)::text from public.viral_training_example_features where cardinality(derived_pattern_ids)=0
union all select 'avg_patterns', coalesce(round(avg(cardinality(derived_pattern_ids))::numeric,2),0)::text from public.viral_training_example_features
union all select 'avg_generator_value', coalesce(round(avg((quality_vector->>'generator_value')::numeric),4),0)::text from public.viral_training_example_features
union all select 'avg_premium_fit', coalesce(round(avg((quality_vector->>'premium_fit')::numeric),4),0)::text from public.viral_training_example_features
union all select 'restricted', count(*)::text from public.viral_training_examples where risk_level='restricted'
union all select 'medium_risk', count(*)::text from public.viral_training_examples where risk_level='medium'
union all select 'low_risk', count(*)::text from public.viral_training_examples where risk_level='low'
union all select 'copy_high', count(*)::text from public.viral_training_examples where copy_risk='high'
union all select 'copy_medium', count(*)::text from public.viral_training_examples where copy_risk='medium'
union all select 'copy_low', count(*)::text from public.viral_training_examples where copy_risk='low'
union all select 'use_pattern_only', count(*)::text from public.viral_training_examples where training_use='pattern_only'
union all select 'use_eval_only', count(*)::text from public.viral_training_examples where training_use='eval_only'
union all select 'use_negative', count(*)::text from public.viral_training_examples where training_use='negative_example'
union all select 'real_viral_seed', count(*)::text from public.viral_training_examples where metadata ? 'real_title'
union all select 'active_compilations', count(*)::text from public.viral_training_compilations where active
union all select 'compiled_profile_enabled', count(*)::text from public.admin_configs where namespace='training.compiled_profile' and version='$CompileVersion' and enabled
union all select 'eval_cases', count(*)::text from public.generator_eval_cases where enabled
union all select 'pattern_rules', count(*)::text from public.viral_pattern_rules where enabled
union all select 'distinct_patterns_affinity', count(distinct pattern_id)::text from public.viral_training_pattern_affinity a join public.viral_training_compilations c on c.id=a.compilation_id where c.active
order by 1;
"@

$m = Get-MetricMap $coreSql

$examples = [double]($m["examples"])
$empty = [double]($m["empty_patterns"])
$restricted = [double]($m["restricted"])
$emptyRate = if ($examples -gt 0) { $empty / [double]$m["features"] } else { 1 }
$restrictedRate = if ($examples -gt 0) { $restricted / $examples } else { 0 }

# Scope checks
$scopes = @("beauty","entertainment_comedy","comedy","travel","food","fashion","fitness","fitness_wellness_safe")
$scopeRows = @{}
$scopeTypes = @{}
foreach ($s in $scopes) {
  $cnt = (Invoke-SqlA "select count(*) from public.training_profile_for_scope('$s','instagram_reels',12);").Trim()
  $scopeRows[$s] = [int]$cnt
  $sc = (Invoke-SqlA "select quality_vector->>'scope' from public.training_profile_for_scope('$s','instagram_reels',1);").Trim()
  $scopeTypes[$s] = $sc
}

# Top categories
$topCatRaw = Invoke-SqlA @"
select a.category_slug || '|' || count(*)::text || '|' || round(avg(a.signal_weight)::numeric,4)::text || '|' || coalesce(sum(a.example_count),0)::text
from viral_training_pattern_affinity a
join viral_training_compilations c on c.id=a.compilation_id and c.active
group by a.category_slug order by sum(a.example_count) desc nulls last limit 15;
"@
$topCategories = @()
foreach ($line in ($topCatRaw -split "`n")) {
  $line = $line.Trim(); if (-not $line) { continue }
  $p = $line -split "\|"
  if ($p.Count -ge 4) {
    $topCategories += [ordered]@{ category=$p[0]; affinity_rows=[int]$p[1]; avg_weight=[double]$p[2]; sum_examples=[int64]$p[3] }
  }
}

# Top patterns overall
$topPatRaw = Invoke-SqlA @"
select a.pattern_id || '|' || a.category_slug || '|' || a.platform || '|' || round(a.signal_weight::numeric,4)::text || '|' || a.example_count::text
from viral_training_pattern_affinity a
join viral_training_compilations c on c.id=a.compilation_id and c.active
order by a.signal_weight desc, a.example_count desc limit 12;
"@
$topPatterns = @()
foreach ($line in ($topPatRaw -split "`n")) {
  $line = $line.Trim(); if (-not $line) { continue }
  $p = $line -split "\|"
  if ($p.Count -ge 5) {
    $topPatterns += [ordered]@{ pattern_id=$p[0]; category=$p[1]; platform=$p[2]; signal_weight=[double]$p[3]; example_count=[int]$p[4] }
  }
}

$critical = @()
$issues = @()
if ($emptyRate -gt $MaxEmptyPatternRate) { $critical += "empty_pattern_rate $emptyRate > $MaxEmptyPatternRate" }
if ($restrictedRate -gt $MaxRestrictedRate) { $critical += "restricted_rate $restrictedRate > $MaxRestrictedRate" }
if ([int]$m["active_compilations"] -lt 1) { $critical += "no_active_compilation" }
if ([int]$m["compiled_profile_enabled"] -lt 1) { $critical += "compile_version_not_enabled:$CompileVersion" }
if ([int]$m["distinct_patterns_affinity"] -lt 40) { $issues += "pattern_coverage_incomplete:$($m['distinct_patterns_affinity'])/40" }
if ($scopeTypes["comedy"] -eq "global_platform_fallback") { $issues += "comedy_slug_uses_global_fallback_use_entertainment_comedy" }
if ($scopeTypes["fitness"] -eq "global_platform_fallback") { $issues += "fitness_slug_uses_global_fallback_use_fitness_wellness_safe" }
if ([double]$m["avg_generator_value"] -lt 0.65) { $issues += "low_avg_generator_value:$($m['avg_generator_value'])" }
$copyHighRate = if ($examples -gt 0) { [double]$m["copy_high"] / $examples } else { 0 }
if ($copyHighRate -gt 0.95) { $issues += "copy_risk_nearly_constant_high_not_discriminative" }

$allIssues = @($critical + $issues)
$grade = "A"
if ($issues.Count -ge 1) { $grade = "B" }
if ($issues.Count -ge 3) { $grade = "C" }
if ($critical.Count -ge 1 -or $allIssues.Count -ge 5) { $grade = "D" }
$issues = $allIssues

$report = [ordered]@{
  generated_at = (Get-Date).ToUniversalTime().ToString("o")
  compile_version = $CompileVersion
  grade = $grade
  pass = ($critical.Count -eq 0)
  critical_issues = $critical
  metrics = $m
  rates = [ordered]@{
    empty_pattern_rate = [math]::Round($emptyRate, 6)
    restricted_rate = [math]::Round($restrictedRate, 6)
    copy_high_rate = [math]::Round($copyHighRate, 6)
    pattern_only_rate = if ($examples -gt 0) { [math]::Round([double]$m["use_pattern_only"] / $examples, 6) } else { 0 }
  }
  scope_profile_counts = $scopeRows
  scope_types = $scopeTypes
  top_categories = $topCategories
  top_patterns = $topPatterns
  issues = $issues
  recommendations = @(
    "Map generator comedy -> entertainment_comedy",
    "Map generator fitness -> fitness_wellness_safe",
    "Run eval-lora-idea-card-generation.py before wiring LoRA",
    "Fix book craft feature upsert if re-applying book package",
    "Consider downweighting commerce_affiliate affinity bias"
  )
}

$jsonPath = Join-Path $OutDir "TRAINING_DEEP_AUDIT_latest.json"
$mdPath = Join-Path $OutDir "TRAINING_DEEP_AUDIT_latest.md"
($report | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $jsonPath -Encoding utf8

$md = @()
$md += "# Training deep audit"
$md += ""
$md += "- Generated: $($report.generated_at)"
$md += "- Compile: **$CompileVersion**"
$md += "- Grade: **$grade**"
$md += "- Pass: **$($report.pass)**"
$md += ""
$md += "## Core metrics"
$md += ""
$md += "| Metric | Value |"
$md += "|---|---:|"
foreach ($k in ($m.Keys | Sort-Object)) { $md += "| $k | $($m[$k]) |" }
$md += ""
$md += "## Rates"
$md += ""
$md += "| Rate | Value |"
$md += "|---|---:|"
$md += "| empty_pattern_rate | $($report.rates.empty_pattern_rate) |"
$md += "| restricted_rate | $($report.rates.restricted_rate) |"
$md += "| copy_high_rate | $($report.rates.copy_high_rate) |"
$md += "| pattern_only_rate | $($report.rates.pattern_only_rate) |"
$md += ""
$md += "## Scope profile"
$md += ""
$md += "| Scope | Rows | Scope type |"
$md += "|---|---:|---|"
foreach ($s in $scopes) { $md += "| $s | $($scopeRows[$s]) | $($scopeTypes[$s]) |" }
$md += ""
$md += "## Issues"
$md += ""
if ($issues.Count -eq 0) { $md += "- (none)" } else { foreach ($i in $issues) { $md += "- $i" } }
$md += ""
$md += "## Top categories"
$md += ""
foreach ($c in $topCategories) { $md += "- $($c.category): affinity=$($c.affinity_rows) avg_w=$($c.avg_weight) sum_ex=$($c.sum_examples)" }
$md += ""
$md += "JSON: ``$jsonPath``"
$md -join "`n" | Set-Content -LiteralPath $mdPath -Encoding utf8

Write-Host ($report | ConvertTo-Json -Depth 6 -Compress)
Write-Host "Wrote $jsonPath"
Write-Host "Wrote $mdPath"

if ($critical.Count -gt 0) { exit 2 }
exit 0
