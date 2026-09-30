$ErrorActionPreference = "Stop"

$workspace = [System.IO.Path]::GetFullPath((Get-Location).Path)
$targets = @(
  [System.IO.Path]::GetFullPath((Join-Path $workspace "tmp\production-migration-20260729-120000")),
  [System.IO.Path]::GetFullPath((Join-Path $workspace "tmp\production-migration-20260729-120001"))
)

foreach ($target in $targets) {
  if (-not $target.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Cleanup target escaped the workspace: $target"
  }
  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Output "Removed $target"
  }
}