$ErrorActionPreference = "Stop"

$workspace = [System.IO.Path]::GetFullPath((Get-Location).Path)
$archive = [System.IO.Path]::GetFullPath((Join-Path $workspace "archive\legacy-premium-assets-20260729"))
$sources = @(
  (Join-Path $workspace "public\assets\premium\boxes"),
  (Join-Path $workspace "public\assets\premium\cards"),
  (Join-Path $workspace "public\assets\premium\marketing")
)

if (-not $archive.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Archive target escaped the workspace."
}

foreach ($source in $sources) {
  $resolved = [System.IO.Path]::GetFullPath($source)
  if (-not $resolved.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Source escaped the workspace: $resolved"
  }
  if (-not (Test-Path -LiteralPath $resolved)) {
    throw "Legacy source is missing: $resolved"
  }
}

New-Item -ItemType Directory -Force -Path $archive | Out-Null
foreach ($source in $sources) {
  Move-Item -LiteralPath $source -Destination $archive
}

Get-ChildItem -LiteralPath $archive -Directory | Select-Object -ExpandProperty Name