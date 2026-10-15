param(
  # Sources live outside the app tree after training archive move.
  [string]$InputDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\Book-Train",
  [string]$OutDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\book_train\prepared\extended",
  [string]$OutputName = "book_train_extended_v1.jsonl",
  [string]$SourceFilter = "",
  [string]$CompileVersion = "2026-v8-book-train-extended",
  [string]$SourceSlug = "book_train_extended_v1",
  [string]$TrendSource = "book_train_extended_v1",
  [int]$MaxRowsPerSource = 30000,
  [int]$MaxScanRowsPerSource = 350000,
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [switch]$PrepareOnly,
  [switch]$KeepExistingSourceObservations,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$prepareArgs = @(
  ".\tools\prepare-book-train-extended-data.py",
  "--input-dir", $InputDir,
  "--out-dir", $OutDir,
  "--output-name", $OutputName,
  "--max-rows-per-source", "$MaxRowsPerSource",
  "--max-scan-rows-per-source", "$MaxScanRowsPerSource"
)

if ($Apply) {
  $prepareArgs += "--apply"
}

if ($SourceFilter -ne "") {
  $prepareArgs += @("--source-filter", $SourceFilter)
}

python @prepareArgs
if ($LASTEXITCODE -ne 0) {
  throw "Book-Train extended preparation failed with exit code $LASTEXITCODE"
}

if (-not $Apply) {
  Write-Host "Dry-run only. Re-run with -Apply to prepare and train."
  exit 0
}

if ($PrepareOnly) {
  Write-Host "Prepared JSONL only. Skipping database training."
  exit 0
}

if (-not $KeepExistingSourceObservations) {
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
  $safeSourceSlug = $SourceSlug.Replace("'", "''")
  docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c "delete from public.dataset_training_observations where metadata ->> 'source_slug' = '$safeSourceSlug';"
}

& .\tools\train-from-dataset.ps1 `
  -DatasetPath $OutDir `
  -Mode book_train_extended `
  -SourceSlug $SourceSlug `
  -TrendSource $TrendSource `
  -CompileVersion $CompileVersion `
  -MaxTrainingExamples $MaxTrainingExamples `
  -MaxTrendSignals $MaxTrendSignals `
  -MaxEvalCases $MaxEvalCases `
  -MaxFileObservations ([Math]::Max(1000, $MaxRowsPerSource * 8)) `
  -Apply
