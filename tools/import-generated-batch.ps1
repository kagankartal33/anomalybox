param(
  [Parameter(Mandatory = $true)]
  [string]$BatchFolder,

  [string]$FunctionsBaseUrl = "http://127.0.0.1:55321/functions/v1",

  [string]$AdminToken = $env:ADMIN_API_TOKEN,

  [switch]$Publish,

  [int]$QualityFloor = 55,

  [int]$MaxReuseCount = 999999
)

$ErrorActionPreference = "Stop"

if (-not $AdminToken) {
  throw "ADMIN_API_TOKEN is required. Pass -AdminToken or set `$env:ADMIN_API_TOKEN."
}

$batchPath = Resolve-Path -LiteralPath $BatchFolder
$manifestPath = Join-Path $batchPath "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "manifest.json not found in $batchPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$headers = @{
  "x-admin-token" = $AdminToken
  "Content-Type" = "application/json"
}

$createBody = @{
  manifest = $manifest
  external_batch_id = $manifest.batch_id
  category_slug = $manifest.category_slug
  persona_slug = $manifest.persona_slug
  target_count = $manifest.target_count
  language = $manifest.language
  platform = $manifest.platform
  generator_version = $manifest.generator_version
  source_mode = "jsonl_import"
} | ConvertTo-Json -Depth 30

Write-Host "Creating generation batch $($manifest.batch_id)..."
$batch = Invoke-RestMethod `
  -Method Post `
  -Uri "$FunctionsBaseUrl/admin-generation-batches" `
  -Headers $headers `
  -Body $createBody

$files = Get-ChildItem -LiteralPath $batchPath -Filter "ideas_*.jsonl" |
  Sort-Object Name |
  ForEach-Object {
    @{
      name = $_.Name
      content = Get-Content -LiteralPath $_.FullName -Raw
    }
  }

if (-not $files -or $files.Count -eq 0) {
  throw "No ideas_*.jsonl files found in $batchPath"
}

$importBody = @{
  manifest = $manifest
  files = @($files)
} | ConvertTo-Json -Depth 50

Write-Host "Importing $($files.Count) JSONL file(s)..."
$importResult = Invoke-RestMethod `
  -Method Post `
  -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/import" `
  -Headers $headers `
  -Body $importBody

Write-Host "Imported: $($importResult.imported), rejected: $($importResult.rejected)"

Write-Host "Scoring batch..."
$scoreResult = Invoke-RestMethod `
  -Method Post `
  -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/score" `
  -Headers $headers `
  -Body "{}"

Write-Host "Scored: $($scoreResult.scored)"

if ($Publish) {
  $publishBody = @{
    quality_floor = $QualityFloor
    max_reuse_count = $MaxReuseCount
  } | ConvertTo-Json

  Write-Host "Publishing inventory..."
  $publishResult = Invoke-RestMethod `
    -Method Post `
    -Uri "$FunctionsBaseUrl/admin-generation-batches/$($batch.id)/publish-inventory" `
    -Headers $headers `
    -Body $publishBody

  Write-Host "Published inventory: $($publishResult.published_inventory)"
}

Write-Host "Done. Batch id: $($batch.id)"