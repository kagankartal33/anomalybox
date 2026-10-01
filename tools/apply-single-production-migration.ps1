$ErrorActionPreference = "Stop"

$expectedProjectRef = "psqqqhcfmfojrqsvzzzb"
$expectedMigration = "20260729120000_checkout_reservations_and_webhook_recovery.sql"
$workspace = [System.IO.Path]::GetFullPath((Get-Location).Path)
$sourceMigration = [System.IO.Path]::GetFullPath((Join-Path $workspace "supabase\\migrations\\$expectedMigration"))
$isolatedRoot = [System.IO.Path]::GetFullPath((Join-Path $workspace "tmp\\production-migration-20260729-120001"))
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
Copy-Item -LiteralPath (Join-Path $workspace "supabase\\config.toml") -Destination (Join-Path $isolatedSupabase "config.toml")
Copy-Item -LiteralPath $sourceMigration -Destination (Join-Path $isolatedMigrations $expectedMigration)

$nativeErrorPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& npx supabase link --project-ref $expectedProjectRef --workdir $isolatedRoot
$linkExit = $LASTEXITCODE
$ErrorActionPreference = $nativeErrorPreference
if ($linkExit -ne 0) {
  throw "Could not link the isolated migration workspace."
}

$ErrorActionPreference = "Continue"
$listJson = (& npx supabase migration list --linked --workdir $isolatedRoot --output-format json 2>&1 | Out-String)
$listExit = $LASTEXITCODE
$ErrorActionPreference = $nativeErrorPreference
if ($listExit -ne 0) {
  throw "Could not inspect isolated production migration state."
}

$listStart = $listJson.IndexOf("{")
$listEnd = $listJson.LastIndexOf("}")
if ($listStart -lt 0 -or $listEnd -le $listStart) {
  throw "Isolated migration list did not return JSON."
}
$list = $listJson.Substring($listStart, $listEnd - $listStart + 1) | ConvertFrom-Json
$rows = @($list.migrations)
if ($rows.Count -ne 1 -or $rows[0].local -ne "20260729120000" -or $rows[0].remote) {
  throw "Isolated migration state is not exactly one local-only migration."
}

Write-Output "Safety check passed: exactly one production migration is pending."
$ErrorActionPreference = "Continue"
& npx supabase migration up --linked --workdir $isolatedRoot
$upExit = $LASTEXITCODE
$ErrorActionPreference = $nativeErrorPreference
if ($upExit -ne 0) {
  throw "The isolated production migration failed."
}

$ErrorActionPreference = "Continue"
$verifyJson = (& npx supabase migration list --linked --workdir $isolatedRoot --output-format json 2>&1 | Out-String)
$verifyExit = $LASTEXITCODE
$ErrorActionPreference = $nativeErrorPreference
if ($verifyExit -ne 0) {
  throw "Could not verify production migration history."
}

$verifyStart = $verifyJson.IndexOf("{")
$verifyEnd = $verifyJson.LastIndexOf("}")
if ($verifyStart -lt 0 -or $verifyEnd -le $verifyStart) {
  throw "Production migration verification did not return JSON."
}
$verify = $verifyJson.Substring($verifyStart, $verifyEnd - $verifyStart + 1) | ConvertFrom-Json
$verifyRows = @($verify.migrations)
if ($verifyRows.Count -ne 1 -or $verifyRows[0].local -ne "20260729120000" -or $verifyRows[0].remote -ne "20260729120000") {
  throw "Production migration history verification failed."
}

Write-Output "Production migration applied and recorded: 20260729120000"