$ErrorActionPreference = "Stop"

$expectedProjectRef = "psqqqhcfmfojrqsvzzzb"
$expectedMigration = "20260729120000_checkout_reservations_and_webhook_recovery.sql"
$workspace = [System.IO.Path]::GetFullPath((Get-Location).Path)
$sourceMigration = [System.IO.Path]::GetFullPath((Join-Path $workspace "supabase\migrations\$expectedMigration"))
$isolatedRoot = [System.IO.Path]::GetFullPath((Join-Path $workspace "tmp\production-migration-20260729-120000"))
$isolatedSupabase = Join-Path $isolatedRoot "supabase"
$isolatedMigrations = Join-Path $isolatedSupabase "migrations"

foreach ($path in @($sourceMigration, $isolatedRoot)) {
  if (-not $path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "A migration path escaped the workspace: $path"
  }
}
if (-not (Test-Path -LiteralPath $sourceMigration)) {
  throw "Expected migration does not exist: $sourceMigration"
}
if (Test-Path -LiteralPath $isolatedRoot) {
  throw "Isolated migration directory already exists; refusing to reuse it."
}

New-Item -ItemType Directory -Force -Path $isolatedMigrations | Out-Null
Copy-Item -LiteralPath (Join-Path $workspace "supabase\config.toml") -Destination (Join-Path $isolatedSupabase "config.toml")
Copy-Item -LiteralPath $sourceMigration -Destination (Join-Path $isolatedMigrations $expectedMigration)

& npx supabase link --project-ref $expectedProjectRef --workdir $isolatedRoot
if ($LASTEXITCODE -ne 0) {
  throw "Could not link the isolated migration workspace."
}

$listJson = (& npx supabase migration list --linked --workdir $isolatedRoot --output-format json 2>$null | Out-String)
if ($LASTEXITCODE -ne 0) {
  throw "Could not inspect isolated production migration state."
}

$list = $listJson | ConvertFrom-Json
$rows = @($list.migrations)
if ($rows.Count -ne 1 -or $rows[0].local -ne "20260729120000" -or $rows[0].remote) {
  throw "Isolated migration state is not exactly one local-only migration."
}

Write-Output "Safety check passed: exactly one production migration is pending."
& npx supabase migration up --linked --workdir $isolatedRoot
if ($LASTEXITCODE -ne 0) {
  throw "The isolated production migration failed."
}

$verifyJson = (& npx supabase migration list --linked --workdir $isolatedRoot --output-format json 2>$null | Out-String)
if ($LASTEXITCODE -ne 0) {
  throw "Could not verify production migration history."
}

$verify = $verifyJson | ConvertFrom-Json
$verifyRows = @($verify.migrations)
if ($verifyRows.Count -ne 1 -or $verifyRows[0].local -ne "20260729120000" -or $verifyRows[0].remote -ne "20260729120000") {
  throw "Production migration history verification failed."
}

Write-Output "Production migration applied and recorded: 20260729120000"