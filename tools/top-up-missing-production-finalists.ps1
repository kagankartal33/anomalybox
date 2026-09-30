param(
  [Parameter(Mandatory = $true)][string]$MissingRoutesPath,
  [int]$GenerationCardsPerMissingCategory = 24,
  [int]$ChunkSize = 25,
  [int]$QualityFloor = 45,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $MissingRoutesPath)) {
  throw "MissingRoutesPath not found: $MissingRoutesPath"
}

$routes = @(Get-Content -LiteralPath $MissingRoutesPath | Where-Object { $_ } | ForEach-Object { $_ | ConvertFrom-Json })
if ($routes.Count -eq 0) {
  Write-Host "No missing routes found."
  return
}

$slugs = @($routes | Select-Object -ExpandProperty category_slug -Unique)
$summary = [ordered]@{
  missing_routes = $routes.Count
  unique_categories = $slugs.Count
  generation_cards_per_missing_category = $GenerationCardsPerMissingCategory
  chunk_size = $ChunkSize
  dry_run = [bool]$DryRun
}

if ($DryRun) {
  $summary | ConvertTo-Json -Depth 6
  $routes | Select-Object -First 25 -Property category_slug, persona_slug, finalist_count, low, mid, high, reason | Format-Table -AutoSize
  return
}

for ($offset = 0; $offset -lt $slugs.Count; $offset += $ChunkSize) {
  $chunk = @($slugs[$offset..([Math]::Min($offset + $ChunkSize - 1, $slugs.Count - 1))])
  $categoryArg = $chunk -join ","
  Write-Host "Generating finalist stock for missing categories $($offset + 1)-$([Math]::Min($offset + $ChunkSize, $slugs.Count)) of $($slugs.Count)"
  powershell -ExecutionPolicy Bypass -File .	ools\generate-category-stock.ps1 `
    -CategorySlugs $categoryArg `
    -CardsPerCategory $GenerationCardsPerMissingCategory `
    -QualityFloor $QualityFloor `
    -MaxTopUpAttempts 6 `
    -ScoreChunkSize 50 `
    -PublishChunkSize 50
}

$summary | ConvertTo-Json -Depth 6