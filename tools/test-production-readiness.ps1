param(
  [string]$FinalistExportPath = "",
  [switch]$SkipBuild,
  [switch]$SkipSlow,
  [switch]$SkipSupabaseLint,
  [switch]$SkipExportDryRun,
  [switch]$SkipAuthSmoke
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Script
  )

  Write-Host ""
  Write-Host "== $Name ==" -ForegroundColor Cyan
  $global:LASTEXITCODE = 0
  & $Script
  if ($global:LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $global:LASTEXITCODE"
  }
}

function Test-SupabaseReachable {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", 58321, $null, $null)
    $success = $iar.AsyncWaitHandle.WaitOne(800, $false)
    if ($success) {
      $client.EndConnect($iar)
      $client.Close()
      return $true
    }
    $client.Close()
    return $false
  } catch {
    return $false
  }
}

Invoke-Step "TypeScript" { npm run typecheck }
Invoke-Step "ESLint" { npm run lint }

if (!$SkipBuild) {
  Invoke-Step "Next.js build" { npm run build }
}

if (!$SkipSupabaseLint) {
  if (Test-SupabaseReachable) {
    Invoke-Step "Supabase DB lint" { supabase db lint --local }
  } else {
    Write-Host ""
    Write-Host "== Supabase DB lint ==" -ForegroundColor Cyan
    Write-Host "Local Supabase stack is offline. Skipping DB lint (run 'supabase start' with Docker to enable)." -ForegroundColor Yellow
  }
}

Invoke-Step "Production leak scan" {
  $scanArgs = @("-File", ".\tools\scan-production-leaks.ps1", "-ScanApp")
  if ($FinalistExportPath) {
    $scanArgs += @("-ExportPath", $FinalistExportPath)
  } else {
    $scanArgs += @("-ScanLatestExport")
  }
  powershell -ExecutionPolicy Bypass @scanArgs
}

Invoke-Step "Creator card placeholder cleanup fixtures" {
  node --experimental-strip-types .\tools\test-card-placeholder-cleanup.mjs
}

Invoke-Step "Store category search fixtures" {
  node --experimental-strip-types .\tools\test-store-category-search.mjs
}

Invoke-Step "Comprehensive E2E, Security & Stress Test Suite" {
  npm run test:suite
}

Invoke-Step "Environment preflight" {
  node .\tools\check-production-env.mjs
}

if (!$SkipAuthSmoke) {
  if (Test-SupabaseReachable) {
    Invoke-Step "Authenticated creator smoke" {
      node .\tools\test-authenticated-creator-smoke.mjs
    }
  } else {
    Write-Host ""
    Write-Host "== Authenticated creator smoke ==" -ForegroundColor Cyan
    Write-Host "Local Supabase stack is offline. Skipping authenticated creator smoke." -ForegroundColor Yellow
  }
}

Invoke-Step "Finalist export size guard" {
  powershell -ExecutionPolicy Bypass -File .\tools\check-export-size.ps1 -ScanLatestExport
}

if (!$SkipExportDryRun) {
  Invoke-Step "Production finalist export dry run" {
    powershell -ExecutionPolicy Bypass -File .\tools\export-production-finalists.ps1 -DryRun
  }
}

if (!$SkipSlow) {
  Invoke-Step "Generator flow" {
    powershell -ExecutionPolicy Bypass -File .\tools\test-generator-flow.ps1
  }

  Invoke-Step "Quality Gate v2" {
    powershell -ExecutionPolicy Bypass -File .\tools\test-quality-gate-v2.ps1
  }

}

Write-Host ""
Write-Host "Production readiness checks completed." -ForegroundColor Green

