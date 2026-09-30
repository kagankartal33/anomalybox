param(
  [string]$InputDir = ".\Book-Train",
  [string]$OutDir = ".\dataset\book_train\prepared",
  [int]$MaxChunksPerBook = 12000,
  [int]$MinChunkChars = 300,
  [int]$MaxChunkChars = 1800,
  [string]$CompileVersion = "2026-v7-book-train-cinema",
  [string]$SourceSlug = "book_train_cinema_v1",
  [string]$TrendSource = "book_train_cinema_v1",
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [switch]$PrepareOnly,
  [switch]$KeepExistingSourceObservations,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$prepareArgs = @(
  ".\tools\prepare-book-train-data.py",
  "--input-dir", $InputDir,
  "--out-dir", $OutDir,
  "--max-chunks-per-book", "$MaxChunksPerBook",
  "--min-chunk-chars", "$MinChunkChars",
  "--max-chunk-chars", "$MaxChunkChars"
)

if ($Apply) {
  $prepareArgs += "--apply"
}

python @prepareArgs
if ($LASTEXITCODE -ne 0) {
  throw "Book-Train preparation failed with exit code $LASTEXITCODE"
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
  -Mode book_train `
  -SourceSlug $SourceSlug `
  -TrendSource $TrendSource `
  -CompileVersion $CompileVersion `
  -MaxTrainingExamples $MaxTrainingExamples `
  -MaxTrendSignals $MaxTrendSignals `
  -MaxEvalCases $MaxEvalCases `
  -MaxFileObservations ([Math]::Max(1000, $MaxChunksPerBook * 8)) `
  -Apply
