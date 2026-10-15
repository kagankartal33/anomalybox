param(
  [string]$InputDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\Book-Train",
  [string]$OutDir = "C:\Users\Kagan\OneDrive\Desktop\ViralBox-training-archive\dataset\book_train\prepared\individual",
  [int]$MaxChunksPerBook = 12000,
  [int]$MinChunkChars = 300,
  [int]$MaxChunkChars = 1800,
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [string]$CombinedCompileVersion = "2026-v7-book-train-cinema",
  [switch]$KeepLastBookActive,
  [switch]$PrepareOnly,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$books = Get-ChildItem -LiteralPath $InputDir -File |
  Where-Object { $_.Extension.ToLowerInvariant() -in @(".pdf", ".epub", ".azw3") } |
  Sort-Object Name

if (-not $books -or $books.Count -eq 0) {
  throw "No Book-Train sources found in $InputDir"
}

$results = @()
for ($i = 0; $i -lt $books.Count; $i++) {
  $bookNumber = $i + 1
  $bookCode = "book{0:D2}" -f $bookNumber
  $sourceRef = "book_train_source_{0:D2}" -f $bookNumber
  $sourceSlug = "book_train_cinema_${bookCode}_v1"
  $compileVersion = "2026-v7-book-train-cinema-${bookCode}"
  $outputName = "book_train_cinema_${bookCode}_v1.jsonl"
  $bookOutDir = Join-Path $OutDir $bookCode

  Write-Host "Preparing/training $bookCode as $sourceSlug ($sourceRef)"

  $argsList = @(
    "-ExecutionPolicy", "Bypass",
    "-File", ".\tools\prepare-and-train-book-train.ps1",
    "-InputDir", $InputDir,
    "-OutDir", $bookOutDir,
    "-MaxChunksPerBook", "$MaxChunksPerBook",
    "-MinChunkChars", "$MinChunkChars",
    "-MaxChunkChars", "$MaxChunkChars",
    "-CompileVersion", $compileVersion,
    "-SourceSlug", $sourceSlug,
    "-TrendSource", $sourceSlug,
    "-MaxTrainingExamples", "$MaxTrainingExamples",
    "-MaxTrendSignals", "$MaxTrendSignals",
    "-MaxEvalCases", "$MaxEvalCases",
    "-SourceFilter", $sourceRef,
    "-OutputName", $outputName,
    "-KeepExistingSourceObservations"
  )

  if ($Apply) {
    $argsList += "-Apply"
  }
  if ($PrepareOnly) {
    $argsList += "-PrepareOnly"
  }

  & powershell @argsList
  if ($LASTEXITCODE -ne 0) {
    throw "$bookCode training failed with exit code $LASTEXITCODE"
  }

  $manifestPath = Join-Path $bookOutDir ($outputName.Replace(".jsonl", ".manifest.json"))
  $rowCount = $null
  if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $rowCount = $manifest.total_rows
  }

  $results += [ordered]@{
    book_code = $bookCode
    source_ref = $sourceRef
    source_slug = $sourceSlug
    compile_version = $compileVersion
    output_file = (Join-Path $bookOutDir $outputName)
    prepared_rows = $rowCount
  }
}

if ($Apply -and -not $PrepareOnly -and -not $KeepLastBookActive) {
  $dbContainer = docker ps --format "{{.Names}}" |
    Where-Object { $_ -eq "supabase_db_ViralBox" } |
    Select-Object -First 1
  if (-not $dbContainer) {
    $dbContainer = docker ps --format "{{.Names}}" |
      Where-Object { $_ -like "supabase_db_*" } |
      Select-Object -First 1
  }
  if (-not $dbContainer) {
    throw "Could not find a running Supabase database container."
  }

  $safeCompile = $CombinedCompileVersion.Replace("'", "''")
  docker exec -i $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -P pager=off -c "update public.viral_training_compilations set active = (version = '$safeCompile'), updated_at = now();"
}

$results | ConvertTo-Json -Depth 10
