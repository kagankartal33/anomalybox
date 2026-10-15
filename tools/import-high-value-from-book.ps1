param(
  [string]$BookRoot = "C:\Users\Kagan\OneDrive\Desktop\Book",
  [string]$OutDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\book_train\prepared\high_value_from_book",
  [int]$MaxCinemaRows = 5000,
  [int]$MaxCraftRows = 2500,
  [int]$MaxCodexRows = 1500,
  [switch]$Apply,
  [switch]$Train
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $repoRoot

$pyArgs = @(
  ".\tools\import-high-value-from-book.py",
  "--book-root", $BookRoot,
  "--out-dir", $OutDir,
  "--max-cinema-rows", "$MaxCinemaRows",
  "--max-craft-rows", "$MaxCraftRows",
  "--max-codex-rows", "$MaxCodexRows"
)
if ($Apply) { $pyArgs += "--apply" }

python @pyArgs
if ($LASTEXITCODE -ne 0) {
  throw "High-value Book import failed with exit code $LASTEXITCODE"
}

if ($Train) {
  if (-not $Apply) {
    throw "Use -Apply with -Train so curated files exist before training."
  }
  powershell -ExecutionPolicy Bypass -File .\tools\train-from-dataset.ps1 `
    -Mode book_train `
    -DatasetPath $OutDir `
    -SourceSlug book_high_value_v1 `
    -CompileVersion 2026-v9-book-high-value `
    -MaxTrainingExamples 12000 `
    -MaxTrendSignals 4000 `
    -MaxEvalCases 120 `
    -Apply
}
