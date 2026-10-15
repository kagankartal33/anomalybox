param(
  # Prepared datasets live in the training archive after move from app tree.
  [string]$DatasetPath = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset",
  [string]$CompileVersion = "2026-v2-dataset",
  [ValidateSet("dataset", "book", "hf", "book_train", "book_train_extended")]
  [string]$Mode = "dataset",
  [string]$SourceSlug = "dataset_full_training_v2",
  [string]$TrendSource = "",
  [int]$BatchSize = 650,
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [int]$MaxFileObservations = 3000,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$argsList = @(
  ".\tools\train-from-dataset.py",
  "--dataset-path", $DatasetPath,
  "--compile-version", $CompileVersion,
  "--mode", $Mode,
  "--source-slug", $SourceSlug,
  "--batch-size", "$BatchSize",
  "--max-training-examples", "$MaxTrainingExamples",
  "--max-trend-signals", "$MaxTrendSignals",
  "--max-eval-cases", "$MaxEvalCases",
  "--max-file-observations", "$MaxFileObservations"
)

if ($TrendSource -ne "") {
  $argsList += @("--trend-source", $TrendSource)
}

if ($Apply) {
  $argsList += "--apply"
}

python @argsList
if ($LASTEXITCODE -ne 0) {
  throw "Dataset training failed with exit code $LASTEXITCODE"
}
