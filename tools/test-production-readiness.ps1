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
  & $Script
}

Invoke-Step "TypeScript" { npm run typecheck }
Invoke-Step "ESLint" { npm run lint }

if (!$SkipBuild) {
  Invoke-Step "Next.js build" { npm run build }
}

if (!$SkipSupabaseLint) {
  Invoke-Step "Supabase DB lint" { supabase db lint --local }
}

Invoke-Step "Production leak scan" {
  $scanArgs = @("-File", ".\\tools\\scan-production-leaks.ps1", "-ScanApp")
  if ($FinalistExportPath) { $scanArgs += @("-ExportPath", $FinalistExportPath) }
  powershell -ExecutionPolicy Bypass @scanArgs
}

if (!$SkipExportDryRun) {
  Invoke-Step "Production finalist export dry run" {
    powershell -ExecutionPolicy Bypass -File .\\tools\\export-production-finalists.ps1 -DryRun
  }
}

if (!$SkipSlow) {
  Invoke-Step "Generator flow" {
    powershell -ExecutionPolicy Bypass -File .\\tools\\test-generator-flow.ps1
  }

  Invoke-Step "Quality Gate v2" {
    powershell -ExecutionPolicy Bypass -File .\\tools\\test-quality-gate-v2.ps1
  }

  Invoke-Step "Creator video review" {
    powershell -ExecutionPolicy Bypass -File .\\tools\\test-creator-video-review.ps1
  }
}

Write-Host ""
Write-Host "Production readiness checks completed." -ForegroundColor Green