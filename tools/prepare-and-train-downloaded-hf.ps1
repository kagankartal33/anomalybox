param(
  [string]$RawDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\huggingface\raw",
  [string]$OutDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\huggingface\prepared_downloaded",
  [int]$MaxRowsPerSource = 50000,
  [int]$MaxScanRowsPerSource = 250000,
  [string]$CompileVersion = "2026-v6-hf-downloaded",
  [string]$SourceSlug = "hf_downloaded_social_v1",
  [string]$TrendSource = "hf_downloaded_training_v1",
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [switch]$PrepareOnly,
  [switch]$KeepExistingSourceObservations,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$prepareArgs = @(
  ".\tools\prepare-downloaded-hf-training-data.py",
  "--raw-dir", $RawDir,
  "--out-dir", $OutDir,
  "--max-rows-per-source", "$MaxRowsPerSource",
  "--max-scan-rows-per-source", "$MaxScanRowsPerSource"
)

if ($Apply) {
  $prepareArgs += "--apply"
}

python @prepareArgs
if ($LASTEXITCODE -ne 0) {
  throw "Downloaded HF preparation failed with exit code $LASTEXITCODE"
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
  -Mode hf `
  -SourceSlug $SourceSlug `
  -TrendSource $TrendSource `
  -CompileVersion $CompileVersion `
  -MaxTrainingExamples $MaxTrainingExamples `
  -MaxTrendSignals $MaxTrendSignals `
  -MaxEvalCases $MaxEvalCases `
  -MaxFileObservations ([Math]::Max(1000, $MaxRowsPerSource * 8)) `
  -Apply
