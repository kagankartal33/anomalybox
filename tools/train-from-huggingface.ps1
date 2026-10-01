param(
  [string]$OutDir = ".\\dataset\\huggingface",
  [int]$MaxRowsPerSource = 1000,
  [switch]$IncludeP1,
  [string]$CompileVersion = "2026-v5-hf-social",
  [string]$SourceSlug = "hf_social_training_v1",
  [string]$TrendSource = "hf_training_v1",
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$fetchArgs = @(
  ".\\tools\\fetch-huggingface-training-data.py",
  "--out-dir", $OutDir,
  "--max-rows-per-source", "$MaxRowsPerSource"
)

if ($IncludeP1) {
  $fetchArgs += "--include-p1"
}

if ($Apply) {
  $fetchArgs += "--apply"
}

python @fetchArgs
if ($LASTEXITCODE -ne 0) {
  throw "Hugging Face fetch failed with exit code $LASTEXITCODE"
}

if (-not $Apply) {
  Write-Host "Dry-run only. Re-run with -Apply to fetch and train."
  exit 0
}

& .\\tools\\train-from-dataset.ps1 `
  -DatasetPath $OutDir `
  -Mode hf `
  -SourceSlug $SourceSlug `
  -TrendSource $TrendSource `
  -CompileVersion $CompileVersion `
  -MaxTrainingExamples $MaxTrainingExamples `
  -MaxTrendSignals $MaxTrendSignals `
  -MaxEvalCases $MaxEvalCases `
  -MaxFileObservations ([Math]::Max(1000, $MaxRowsPerSource * 12)) `
  -Apply
