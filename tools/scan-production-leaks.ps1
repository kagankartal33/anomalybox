param(
  [string]$ExportPath = "",
  [switch]$ScanLatestExport,
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
  @{ Name = "raw template placeholder leak"; Pattern = "\{(product_name|audience_pain|daily_context|signature_phrase|[a-z]+_[a-z0-9_]+)\}" },
  @{ Name = "training table leak"; Pattern = "dataset_training" },
  @{ Name = "training source leak"; Pattern = "training source|source_slug" },
  @{ Name = "Hugging Face source leak"; Pattern = "Hugging Face|huggingface|hf_social" },
  @{ Name = "social dataset source leak"; Pattern = "Reddit jokes|Reddit questions|Reddit confessions|Reddit TIFU|YouTube popular" },
  @{ Name = "Turkish creator-facing leftover"; Pattern = "\b(Bugun|goster|gosterir|karar filtresi|guvenli|urun|cekim|sahne|kaydet|yorum)\b" }
)

$forbiddenTitlePatterns = @(
  @{ Name = "document-style card title"; Pattern = "\b(Brief|Ritual|Report|Memo|Audit|Dossier|File|Sheet|SOP|Framework|Blueprint)\b" },
  @{ Name = "AI-sounding card title"; Pattern = "\b(AI|Algorithm|Engine|Model|Prompt|Agent|Neural|Autopilot|System)\b" },
  @{ Name = "internal card title"; Pattern = "\b(Quality Gate|score|score_band|training|dataset|inventory)\b|run_\d{8}_\d{6}" },
  @{ Name = "numbered card title"; Pattern = "\b\d{3,}\b" }
)

$findings = New-Object System.Collections.Generic.List[object]
$seenCardTitles = @{}
$creatorVisibleCardFields = @(
  "title",
  "idea_summary",
  "one_sentence_premise",
  "video_blueprint",
  "scene_script",
  "shot_list",
  "b_roll_plan",
  "pose_direction",
  "micro_behavior_guide",
  "camera_direction",
  "editing_notes",
  "editing_timeline",
  "edit_assembly_guide",
  "execution_ranges",
  "hook_performance_pack",
  "why_it_can_work"
)

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

function Test-CardTitle {
  param(
    [string]$Source,
    [AllowNull()][object]$Value,
    [switch]$SkipDuplicateCheck
  )

  if ($null -eq $Value) {
    Add-Finding -Source $Source -PatternName "missing card title" -Snippet "missing"
    return
  }
  $text = ([string]$Value).Trim()
  if ([string]::IsNullOrWhiteSpace($text)) {
    Add-Finding -Source $Source -PatternName "missing card title" -Snippet "empty"
    return
  }
  if ($text.Length -gt 52) {
    Add-Finding -Source $Source -PatternName "card title too long" -Snippet $text
  }
  if (-not $SkipDuplicateCheck) {
    if ($seenCardTitles.ContainsKey($text)) {
      Add-Finding -Source $Source -PatternName "duplicate card title" -Snippet $text
    } else {
      $seenCardTitles[$text] = $true
    }
  }
  foreach ($rule in $forbiddenTitlePatterns) {
    if ($text -match $rule.Pattern) {
      Add-Finding -Source $Source -PatternName $rule.Name -Snippet $text
    }
  }
}

function Test-CreatorVisibleObject {
  param(
    [string]$Source,
    [AllowNull()][object]$Value
  )

  if ($null -eq $Value) { return }
  if ($Value -is [string] -or $Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal] -or $Value -is [bool]) {
    Test-VisibleText -Source $Source -Value $Value
    return
  }
  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    $index = 0
    foreach ($item in $Value) {
      Test-CreatorVisibleObject -Source "$Source[$index]" -Value $item
      $index += 1
    }
    return
  }
  if ($Value.PSObject -and $Value.PSObject.Properties) {
    foreach ($prop in $Value.PSObject.Properties) {
      if ($prop.Name -eq "personalization_slots") { continue }
      Test-CreatorVisibleObject -Source "$Source.$($prop.Name)" -Value $prop.Value
    }
  }
}

function Test-CreatorVisibleCardPayload {
  param(
    [string]$Source,
    [AllowNull()][object]$Card
  )

  if ($null -eq $Card) { return }
  foreach ($field in $creatorVisibleCardFields) {
    $prop = $Card.PSObject.Properties[$field]
    if ($prop) {
      Test-CreatorVisibleObject -Source "$Source.$field" -Value $prop.Value
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

if (!$ExportPath -and ($ScanLatestExport -or !$ScanApp)) {
  $ExportPath = Resolve-LatestExport
}

if ($ExportPath -and (Test-Path $ExportPath)) {
  Write-Host "Scanning creator-facing finalist fields: $ExportPath"
  $lineNumber = 0
  Get-Content -LiteralPath $ExportPath | ForEach-Object {
    $lineNumber += 1
    if (![string]::IsNullOrWhiteSpace($_)) {
      $row = $_ | ConvertFrom-Json
      Test-VisibleText -Source "$ExportPath line $lineNumber title" -Value $row.title
      Test-VisibleText -Source "$ExportPath line $lineNumber premise" -Value $row.one_sentence_premise
      if ($row.card) {
        Test-CardTitle -Source "$ExportPath line $lineNumber card title" -Value $row.card.title
        if ($row.card.card) {
          Test-CardTitle -Source "$ExportPath line $lineNumber idea_card.title" -Value $row.card.card.title -SkipDuplicateCheck
          Test-CreatorVisibleCardPayload -Source "$ExportPath line $lineNumber idea_card" -Card $row.card.card
        }
      }
    }
  }
} else {
  if ($ScanLatestExport -or !$ScanApp) {
    Write-Warning "No production finalist export found. Pass -ExportPath to scan a specific finalist_cards.jsonl file."
  } else {
    Write-Host "Skipping finalist export scan. Pass -ExportPath or -ScanLatestExport to include production finalist cards."
  }
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
