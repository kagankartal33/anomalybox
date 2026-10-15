param(
  [string]$ExportPath = "",
  [switch]$ScanLatestExport,
  [int]$WarnCardCount = 2500,
  [int]$FailCardCount = 8000,
  [double]$WarnSizeMb = 40,
  [double]$FailSizeMb = 120
)

$ErrorActionPreference = "Stop"

function Resolve-LatestExport {
  $root = Join-Path (Split-Path -Parent (Split-Path -Parent $PSCommandPath)) "production_exports"
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
  throw "Export path not found. Pass -ExportPath or -ScanLatestExport with a production_exports/mvp_finalists_*/finalist_cards.jsonl package."
}

$file = Get-Item -LiteralPath $ExportPath
$cardCount = 0
Get-Content -LiteralPath $file.FullName | ForEach-Object {
  if (![string]::IsNullOrWhiteSpace($_)) { $cardCount += 1 }
}
$sizeMb = [math]::Round($file.Length / 1MB, 2)

Write-Host "== Finalist export size guard =="
Write-Host "Path:  $($file.FullName)"
Write-Host "Cards: $cardCount"
Write-Host "Size:  $sizeMb MB"
Write-Host "Warn:  $WarnCardCount cards / $WarnSizeMb MB"
Write-Host "Fail:  $FailCardCount cards / $FailSizeMb MB"
Write-Host ""
Write-Host "Supabase Free comfort note: keep inventory import packages modest so row count + storage stay within free-tier operational headroom."

$warnings = @()
$errors = @()

if ($cardCount -ge $FailCardCount) {
  $errors += "Card count $cardCount exceeds hard fail threshold $FailCardCount."
} elseif ($cardCount -ge $WarnCardCount) {
  $warnings += "Card count $cardCount is above warn threshold $WarnCardCount."
}

if ($sizeMb -ge $FailSizeMb) {
  $errors += "Package size $sizeMb MB exceeds hard fail threshold $FailSizeMb MB."
} elseif ($sizeMb -ge $WarnSizeMb) {
  $warnings += "Package size $sizeMb MB is above warn threshold $WarnSizeMb MB."
}

foreach ($warning in $warnings) {
  Write-Warning $warning
}

if ($errors.Count -gt 0) {
  foreach ($item in $errors) {
    Write-Host $item -ForegroundColor Red
  }
  throw "Export size guard failed."
}

if ($warnings.Count -gt 0) {
  Write-Host "Export size guard passed with warnings." -ForegroundColor Yellow
} else {
  Write-Host "Export size guard passed." -ForegroundColor Green
}
