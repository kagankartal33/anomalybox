param(
  [string]$RawDir = ".\dataset\huggingface\raw",
  [string]$OutDir = ".\dataset\huggingface",
  [int]$MaxRowsPerSource = 50000,
  [string]$CompileVersion = "2026-v6-hf-downloaded",
  [string]$SourceSlug = "hf_downloaded_social_v1",
  [string]$TrendSource = "hf_downloaded_training_v1",
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [switch]$PrepareOnly,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$prepareArgs = @(
  ".\tools\prepare-downloaded-hf-training-data.py",
  "--raw-dir", $RawDir,
  "--out-dir", $OutDir,
  "--max-rows-per-source", "$MaxRowsPerSource"
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
