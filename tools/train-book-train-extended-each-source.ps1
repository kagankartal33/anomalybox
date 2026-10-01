param(
  [string]$InputDir = ".\\Book-Train",
  [string]$OutDir = ".\\dataset\\book_train\\prepared\\extended\\individual",
  [int]$MaxRowsPerSource = 30000,
  [int]$MaxScanRowsPerSource = 350000,
  [int]$MaxTrainingExamples = 25000,
  [int]$MaxTrendSignals = 12000,
  [int]$MaxEvalCases = 200,
  [string]$CombinedCompileVersion = "2026-v8-book-train-extended",
  [switch]$KeepLastSourceActive,
  [switch]$PrepareOnly,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$sources = @(
  "seo_glossary",
  "leadgen_seo_qa",
  "seo_serp_signals",
  "twitter_sentiment",
  "amazon_review_polarity_train",
  "amazon_review_polarity_test",
  "amazon_review_polarity_archive"
)

$results = @()
foreach ($source in $sources) {
  $sourceSlug = "book_train_extended_${source}_v1"
  $compileVersion = "2026-v8-book-train-extended-$($source.Replace('_','-'))"
  $outputName = "book_train_extended_${source}_v1.jsonl"
  $sourceOutDir = Join-Path $OutDir $source

  Write-Host "Preparing/training $source as $sourceSlug"

  $argsList = @(
    "-ExecutionPolicy", "Bypass",
    "-File", ".\\tools\\prepare-and-train-book-train-extended.ps1",
    "-InputDir", $InputDir,
    "-OutDir", $sourceOutDir,
    "-OutputName", $outputName,
    "-SourceFilter", $source,
    "-CompileVersion", $compileVersion,
    "-SourceSlug", $sourceSlug,
    "-TrendSource", $sourceSlug,
    "-MaxRowsPerSource", "$MaxRowsPerSource",
    "-MaxScanRowsPerSource", "$MaxScanRowsPerSource",
    "-MaxTrainingExamples", "$MaxTrainingExamples",
    "-MaxTrendSignals", "$MaxTrendSignals",
    "-MaxEvalCases", "$MaxEvalCases",
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
    throw "$source training failed with exit code $LASTEXITCODE"
  }

  $manifestPath = Join-Path $sourceOutDir ($outputName.Replace(".jsonl", ".manifest.json"))
  $rowCount = $null
  if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $rowCount = $manifest.total_rows
  }

  $results += [ordered]@{
    source = $source
    source_slug = $sourceSlug
    compile_version = $compileVersion
    output_file = (Join-Path $sourceOutDir $outputName)
    prepared_rows = $rowCount
  }
}

if ($Apply -and -not $PrepareOnly -and -not $KeepLastSourceActive) {
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