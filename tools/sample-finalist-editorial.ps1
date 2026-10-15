param(
  [string]$ExportPath = "",
  [switch]$ScanLatestExport,
  [int]$SampleSize = 50,
  [int]$Seed = 0
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

function Resolve-LatestExport {
  $root = Join-Path $repoRoot "production_exports"
  if (!(Test-Path $root)) { return "" }
  $latest = Get-ChildItem -Path $root -Directory -Filter "mvp_finalists_*" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (!$latest) { return "" }
  $jsonl = Join-Path $latest.FullName "finalist_cards.jsonl"
  if (Test-Path $jsonl) { return $jsonl }
  return ""
}

if (!$ExportPath -and $ScanLatestExport) {
  $ExportPath = Resolve-LatestExport
}
if (!$ExportPath -or !(Test-Path $ExportPath)) {
  throw "Export path not found. Pass -ExportPath or -ScanLatestExport."
}

$lines = @(Get-Content -LiteralPath $ExportPath | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($lines.Count -eq 0) { throw "Export is empty: $ExportPath" }

$sampleCount = [Math]::Min($SampleSize, $lines.Count)
if ($Seed -gt 0) {
  Get-Random -SetSeed $Seed | Out-Null
}
$sampleIndexes = 0..($lines.Count - 1) | Get-Random -Count $sampleCount | Sort-Object

$issues = New-Object System.Collections.Generic.List[object]
$ok = 0

function Add-Issue {
  param([int]$Line, [string]$Kind, [string]$Snippet)
  $issues.Add([pscustomobject]@{
    line = $Line
    kind = $Kind
    snippet = (($Snippet -replace "\s+", " ").Trim().Substring(0, [Math]::Min(160, (($Snippet -replace "\s+", " ").Trim().Length))))
  }) | Out-Null
}

foreach ($index in $sampleIndexes) {
  $lineNumber = $index + 1
  $raw = $lines[$index]
  try {
    $row = $raw | ConvertFrom-Json
  } catch {
    Add-Issue -Line $lineNumber -Kind "invalid_json" -Snippet $raw
    continue
  }

  $inner = $null
  if ($row.card -and $row.card.card) { $inner = $row.card.card }
  elseif ($row.card) { $inner = $row.card }

  $title = [string]($row.title)
  if ([string]::IsNullOrWhiteSpace($title) -and $row.card -and $row.card.title) { $title = [string]$row.card.title }
  if ([string]::IsNullOrWhiteSpace($title) -and $inner -and $inner.title) { $title = [string]$inner.title }

  $premise = [string]($row.one_sentence_premise)
  if ([string]::IsNullOrWhiteSpace($premise) -and $inner) {
    if ($inner.one_sentence_premise) { $premise = [string]$inner.one_sentence_premise }
    elseif ($inner.idea_summary -and $inner.idea_summary.premise) { $premise = [string]$inner.idea_summary.premise }
    elseif ($inner.idea_summary -and $inner.idea_summary.creator_takeaway) { $premise = [string]$inner.idea_summary.creator_takeaway }
    elseif ($inner.concept) { $premise = [string]$inner.concept }
  }

  if ([string]::IsNullOrWhiteSpace($title)) {
    Add-Issue -Line $lineNumber -Kind "missing_title" -Snippet $raw
  }
  if ($title -match 'run_\d{8}_\d{6}|Quality Gate|score_band|\{[a-z0-9_]+\}') {
    Add-Issue -Line $lineNumber -Kind "leaky_title" -Snippet $title
  }
  if ($premise -match 'run_\d{8}_\d{6}|Quality Gate|score_band|\{[a-z0-9_]+\}') {
    Add-Issue -Line $lineNumber -Kind "leaky_premise" -Snippet $premise
  }
  if ($title.Length -gt 72) {
    Add-Issue -Line $lineNumber -Kind "title_too_long" -Snippet $title
  }
  if ([string]::IsNullOrWhiteSpace($premise) -or $premise.Length -lt 12) {
    Add-Issue -Line $lineNumber -Kind "weak_premise" -Snippet $premise
  }

  $hasRanges = $false
  $hasShotList = $false
  if ($inner -and $inner.execution_ranges) {
    $hasRanges = @($inner.execution_ranges).Count -gt 0
  }
  if ($inner -and $inner.shot_list) {
    $hasShotList = @($inner.shot_list).Count -gt 0
  }
  if (-not $hasRanges -and -not $hasShotList) {
    # Not always fatal for legacy packs, but flag for editorial attention.
    Add-Issue -Line $lineNumber -Kind "missing_execution_structure" -Snippet $title
  } else {
    $ok += 1
  }
}

Write-Host "== Finalist editorial sample =="
Write-Host "Export:  $ExportPath"
Write-Host "Total:   $($lines.Count)"
Write-Host "Sample:  $sampleCount"
Write-Host "Cleanish range-bearing cards in sample: $ok"
Write-Host "Issues:  $($issues.Count)"

if ($issues.Count) {
  Write-Host ""
  $issues | Group-Object kind | Sort-Object Count -Descending | ForEach-Object {
    Write-Host ("{0,4}  {1}" -f $_.Count, $_.Name)
  }
  Write-Host ""
  $issues | Select-Object -First 30 | Format-Table -AutoSize
  if ($issues.Count -gt 30) {
    Write-Host "Showing first 30 issue rows."
  }
}

# Soft fail only for hard leak/missing title cases.
$hard = @($issues | Where-Object { $_.kind -in @("invalid_json", "missing_title", "leaky_title", "leaky_premise") })
if ($hard.Count -gt 0) {
  throw "Editorial sample failed with $($hard.Count) hard issue(s)."
}

Write-Host ""
Write-Host "Editorial sample completed (no hard leaks/missing titles)." -ForegroundColor Green
