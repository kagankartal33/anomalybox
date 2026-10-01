param(
  [int]$QualityGateIdeaCount = 1000,
  [int]$QualityGateScoreChunkSize = 25,
  [int]$QualityGatePublishChunkSize = 100,
  [string]$DatasetCompileVersion = "2026-v8-book-train-extended",
  [string]$DatasetSourceSlug = "book_train_extended_v1",
  [string]$DatasetTrendSource = "book_train_extended_v1",
  [string]$DatasetEvalPrefix = "book_train_extended_eval",
  [string[]]$DatasetProfileCategories = @("entertainment_comedy", "creator_education", "lifestyle", "product_reviews"),
  [int]$DatasetMinObservations = 1,
  [int]$DatasetMinExamples = 1,
  [switch]$SkipQualityGate,
  [switch]$SkipDatasetTraining
)

$ErrorActionPreference = "Stop"
$toolRoot = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $toolRoot
. (Join-Path $toolRoot "local-functions.ps1")

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Script
  )

  Write-Host ""
  Write-Host "==> $Name"
  & $Script
  Write-Host "OK: $Name"
}

Push-Location $repoRoot
try {
  Invoke-Step "cleanup stale functions containers" {
    Stop-LocalFunctionServers -RemoveEdgeRuntime
  }

  Invoke-Step "start local Supabase stack" {
    supabase start
  }

  Invoke-Step "apply pending local migrations" {
    supabase migration up --local
  }

  Invoke-Step "lint local database" {
    supabase db lint --local
  }

  Invoke-Step "test generator import, scoring and inventory flow" {
    & (Join-Path $toolRoot "test-generator-flow.ps1")
  }

  if (-not $SkipQualityGate) {
    Invoke-Step "test Quality Gate v2.1 stress flow" {
      & (Join-Path $toolRoot "test-quality-gate-v2.ps1") `
        -IdeaCount $QualityGateIdeaCount `
        -ScoreChunkSize $QualityGateScoreChunkSize `
        -PublishChunkSize $QualityGatePublishChunkSize
    }
  }

  if (-not $SkipDatasetTraining) {
    Invoke-Step "test active dataset training profile" {
      & (Join-Path $toolRoot "test-dataset-training.ps1") `
        -CompileVersion $DatasetCompileVersion `
        -SourceSlug $DatasetSourceSlug `
        -TrendSource $DatasetTrendSource `
        -EvalPrefix $DatasetEvalPrefix `
        -ProfileCategories $DatasetProfileCategories `
        -MinObservations $DatasetMinObservations `
        -MinDatasetExamples $DatasetMinExamples
    }
  }
} finally {
  Stop-LocalFunctionServers -RemoveEdgeRuntime
  Pop-Location
}
