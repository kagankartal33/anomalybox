param(
  [string]$BaseUrl = "http://127.0.0.1:3000",
  [switch]$StartDevServer,
  [int]$ReadyTimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$publicRoutes = @(
  @{ Path = "/"; MustContain = @("Anomaly Box") },
  @{ Path = "/store"; MustContain = @("Store") },
  @{ Path = "/pricing"; MustContain = @("Pricing", "Classic Red") },
  @{ Path = "/legal"; MustContain = @("Legal") },
  @{ Path = "/atelier"; MustContain = @("Atelier") },
  @{ Path = "/login"; MustContain = @("Welcome", "Forgot password") },
  @{ Path = "/forgot-password"; MustContain = @("Reset your password") },
  @{ Path = "/reset-password"; MustContain = @("recovery link") },
  @{ Path = "/robots.txt"; MustContain = @("User-agent", "Sitemap") },
  @{ Path = "/sitemap.xml"; MustContain = @("urlset", "loc") }
)

$protectedRoutes = @(
  "/boxes",
  "/profile",
  "/admin"
)

$devProcess = $null

function Test-ServerReady {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}

Push-Location $repoRoot
try {
  $ready = Test-ServerReady -Url $BaseUrl
  if (-not $ready -and $StartDevServer) {
    Write-Host "Starting Next.js dev server for route smoke..."
    $npmExecutable = if ($IsWindows -or $env:OS -eq "Windows_NT") { "npm.cmd" } else { "npm" }
    $devProcess = Start-Process -FilePath $npmExecutable -ArgumentList @("run", "dev", "--", "-H", "127.0.0.1", "-p", "3000") -PassThru -WindowStyle Hidden
    $deadline = (Get-Date).AddSeconds($ReadyTimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
      if (Test-ServerReady -Url $BaseUrl) {
        $ready = $true
        break
      }
      Start-Sleep -Seconds 2
    }
  }

  Assert-True -Condition $ready -Message "App server is not reachable at $BaseUrl. Start 'npm run dev' or pass -StartDevServer."

  Write-Host "== Public route smoke against $BaseUrl =="
  foreach ($route in $publicRoutes) {
    $url = "$BaseUrl$($route.Path)"
    Write-Host "GET $url"
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
    Assert-True -Condition ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) -Message "Expected 2xx/3xx for $($route.Path), got $($response.StatusCode)"
    $body = [string]$response.Content
    $bodyLower = $body.ToLowerInvariant()
    foreach ($needle in $route.MustContain) {
      $needleLower = $needle.ToLowerInvariant()
      Assert-True -Condition ($bodyLower.Contains($needleLower)) -Message "Route $($route.Path) missing expected content '$needle'"
    }
    Write-Host "OK  $($route.Path) ($($response.StatusCode))"
  }

  Write-Host "== Protected route redirect smoke =="
  foreach ($path in $protectedRoutes) {
    $url = "$BaseUrl$path"
    Write-Host "GET $url (expect auth redirect or login gate)"
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0 -ErrorAction Stop
      # Some stacks return 200 login page without redirect.
      $body = [string]$response.Content
      $looksProtected = $response.StatusCode -in 301, 302, 303, 307, 308 -or $body -match "Login|Sign in|sign in|login"
      Assert-True -Condition $looksProtected -Message "Protected route $path unexpectedly rendered open content with status $($response.StatusCode)"
      Write-Host "OK  $path gated ($($response.StatusCode))"
    } catch {
      $status = $null
      if ($_.Exception.Response) {
        $status = [int]$_.Exception.Response.StatusCode
      }
      Assert-True -Condition ($status -in 301, 302, 303, 307, 308, 401, 403) -Message "Protected route $path failed unexpectedly: $($_.Exception.Message)"
      Write-Host "OK  $path gated ($status)"
    }
  }

  Write-Host ""
  Write-Host "Public route smoke passed." -ForegroundColor Green
} finally {
  if ($devProcess -and -not $devProcess.HasExited) {
    Write-Host "Stopping temporary dev server (pid $($devProcess.Id))..."
    Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue
  }
  Pop-Location
}
