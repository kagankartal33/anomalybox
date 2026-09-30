param(
  [string]$DatasetPath = ".\dataset",
  [string]$CompileVersion = "2026-v2-dataset",
  [int]$BatchSize = 650,
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$argsList = @(
  ".\tools\train-from-dataset.py",
  "--dataset-path", $DatasetPath,
  "--compile-version", $CompileVersion,
  "--batch-size", "$BatchSize",
  "--max-training-examples", "$MaxTrainingExamples",
  "--max-trend-signals", "$MaxTrendSignals",
  "--max-eval-cases", "$MaxEvalCases"
)

if ($Apply) {
  $argsList += "--apply"
}

python @argsList
if ($LASTEXITCODE -ne 0) {
  throw "Dataset training failed with exit code $LASTEXITCODE"
}