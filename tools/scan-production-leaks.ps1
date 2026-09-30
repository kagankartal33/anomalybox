param(
  [string]$ExportPath = "",
  [switch]$ScanApp,
  [int]$MaxFindings = 50
)

$ErrorActionPreference = "Stop"

$forbiddenPatterns = @(
  @{ Name = "raw generator run id"; Pattern = "run_\d{8}_\d{6}" },
  @{ Name = "Quality Gate language"; Pattern = "Quality Gate" },
  @{ Name = "Turkish internal filter phrase"; Pattern = "premium karar filtresi" },
  @{ Name = "score band leak"; Pattern = "\bscore_band\b" },
  @{ Name = "assigned band leak"; Pattern = "\bassigned_band\b" },
  @{ Name = "internal rank leak"; Pattern = "\binternal_rank_score\b" },
  @{ Name = "training table leak"; Pattern = "dataset_training" },
  @{ Name = "training source leak"; Pattern = "training source|source_slug" },
  @{ Name = "Hugging Face source leak"; Pattern = "Hugging Face|huggingface|hf_social" },
  @{ Name = "social dataset source leak"; Pattern = "Reddit jokes|Reddit questions|Reddit confessions|Reddit TIFU|YouTube popular" }
)

$findings = New-Object System.Collections.Generic.List[object]

function Add-Finding {
  param(
    [string]$Source,
    [string]$PatternName,
    [string]$Snippet
  )

  if ($findings.Count -ge $MaxFindings) { return }
  $findings.Add([pscustomobject]@{
    source = $Source
    issue = $PatternName
    snippet = ($Snippet -replace "\s+", " ").Trim().Substring(0, [Math]::Min(180, ($Snippet -replace "\s+", " ").Trim().Length))
  }) | Out-Null
}

function Test-VisibleText {
  param(
    [string]$Source,
    [AllowNull()][object]$Value
  )

  if ($null -eq $Value) { return }
  $text = [string]$Value
  if ([string]::IsNullOrWhiteSpace($text)) { return }

  foreach ($rule in $forbiddenPatterns) {
    if ($text -match $rule.Pattern) {
      Add-Finding -Source $Source -PatternName $rule.Name -Snippet $text
    }
  }
}

function Resolve-LatestExport {
  $root = Join-Path (Get-Location) "production_exports"
  if (!(Test-Path $root)) { return "" }
  $latest = Get-ChildItem -Path $root -Directory -Filter "mvp_finalists_*" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (!$latest) { return "" }
  return Join-Path $latest.FullName "finalist_cards.jsonl"
}

if (!$ExportPath) {
  $ExportPath = Resolve-LatestExport
}

if ($ExportPath -and (Test-Path $ExportPath)) {
  Write-Host "Scanning creator-facing finalist fields: $ExportPath"
  $lineNumber = 0
  Get-Content -LiteralPath $ExportPath | ForEach-Object {
    $lineNumber += 1
    if ([string]::IsNullOrWhiteSpace($_)) { return }
    $row = $_ | ConvertFrom-Json
    Test-VisibleText -Source "$ExportPath line $lineNumber title" -Value $row.title
    Test-VisibleText -Source "$ExportPath line $lineNumber premise" -Value $row.one_sentence_premise
    if ($row.card) {
      $cardJson = $row.card | ConvertTo-Json -Depth 80 -Compress
      Test-VisibleText -Source "$ExportPath line $lineNumber idea_card" -Value $cardJson
    }
  }
} else {
  Write-Warning "No production finalist export found. Pass -ExportPath to scan a specific finalist_cards.jsonl file."
}

if ($ScanApp) {
  $appTargets = @(
    "app\page.tsx",
    "app\store\page.tsx",
    "app\boxes",
    "app\cards",
    "app\atelier",
    "app\legal",
    "components"
  )

  foreach ($target in $appTargets) {
    if (!(Test-Path $target)) { continue }
    $files = if ((Get-Item $target).PSIsContainer) {
      Get-ChildItem -Path $target -Recurse -File -Include "*.ts", "*.tsx"
    } else {
      @(Get-Item $target)
    }

    foreach ($file in $files) {
      $line = 0
      Get-Content -LiteralPath $file.FullName | ForEach-Object {
        $line += 1
        Test-VisibleText -Source "$($file.FullName):$line" -Value $_
      }
    }
  }
}

if ($findings.Count -gt 0) {
  Write-Host ""
  Write-Host "Potential creator-facing leaks found:" -ForegroundColor Red
  $findings | Format-Table -AutoSize
  throw "Production leak scan failed with $($findings.Count) finding(s)."
}

Write-Host "Production leak scan passed."