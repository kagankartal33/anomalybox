param(
  [string]$BaseUrl = "https://anomalybox.com"
)

$ErrorActionPreference = "Stop"

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}

function Status-WithoutRedirect {
  param([string]$Uri, [string]$Method = "GET", [string]$Body = "", [string]$ContentType = "application/json")
  $request = @{
    Uri = $Uri
    Method = $Method
    UseBasicParsing = $true
    MaximumRedirection = 0
    ErrorAction = "Stop"
  }
  if ($Method -ne "GET") {
    $request.Body = $Body
    $request.ContentType = $ContentType
  }
  try {
    $response = Invoke-WebRequest @request
    return @{ Status = [int]$response.StatusCode; Location = [string]$response.Headers.Location; Body = [string]$response.Content }
  } catch {
    if (-not $_.Exception.Response) { throw }
    $response = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
    return @{ Status = [int]$response.StatusCode; Location = [string]$response.Headers["Location"]; Body = $reader.ReadToEnd() }
  }
}

$routes = @(
  @{ Path = "/"; Text = "Anomaly Box" },
  @{ Path = "/store"; Text = "Store" },
  @{ Path = "/pricing"; Text = "Classic Red" },
  @{ Path = "/atelier"; Text = "ATELIER" },
  @{ Path = "/login"; Text = "Forgot password" },
  @{ Path = "/forgot-password"; Text = "Reset your password" },
  @{ Path = "/reset-password"; Text = "recovery link" },
  @{ Path = "/legal"; Text = "Digital Goods" }
)

foreach ($route in $routes) {
  $response = Invoke-WebRequest -Uri "$BaseUrl$($route.Path)" -UseBasicParsing -TimeoutSec 30
  Assert-True ($response.StatusCode -eq 200) "Route $($route.Path) returned $($response.StatusCode)."
  Assert-True ([string]$response.Content).Contains($route.Text) "Route $($route.Path) is missing '$($route.Text)'."
  Write-Output "OK route $($route.Path)"
}

$homeResponse = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 30
Assert-True (-not ([string]$homeResponse.Content).Contains("/assets/premium/boxes/")) "Home still references legacy box assets."
Assert-True ([string]$homeResponse.Content).Contains("hero-studio-desktop") "Home does not reference the premium studio hero."

$assets = @(
  "/icon.png",
  "/favicon.ico",
  "/brand/logo-horizontal-ink.svg",
  "/assets/premium/studio/hero-studio-desktop.webp",
  "/assets/premium/studio/hero-studio-mobile.webp",
  "/assets/premium/studio/workflow-receive.webp",
  "/assets/premium/card-guides/guide_video_flow.webp"
)
foreach ($asset in $assets) {
  $response = Invoke-WebRequest -Uri "$BaseUrl$asset" -UseBasicParsing -TimeoutSec 30
  Assert-True ($response.StatusCode -eq 200) "Asset $asset returned $($response.StatusCode)."
  Assert-True ($response.RawContentLength -gt 0) "Asset $asset is empty."
  Write-Output "OK asset $asset"
}

$availability = Invoke-RestMethod -Uri "$BaseUrl/api/store/availability?box_product_slug=viral_box_500&category_slug=beauty&persona_slug=luxury_editor" -TimeoutSec 30
Assert-True ($availability.ok -eq $true) "Approved Beauty inventory is not available for Classic Red."
Write-Output "OK production inventory availability"

$checkout = Status-WithoutRedirect -Uri "$BaseUrl/api/checkout" -Method "POST" -Body '{"box_product_slug":"viral_box_500","category_slug":"beauty","persona_slug":"luxury_editor"}'
Assert-True ($checkout.Status -eq 401) "Unauthenticated checkout did not fail with 401."
Assert-True ($checkout.Body.Contains("login_required")) "Unauthenticated checkout did not provide the login handoff."
Write-Output "OK checkout authentication gate"

$webhook = Status-WithoutRedirect -Uri "$BaseUrl/api/stripe/webhook" -Method "POST" -Body '{}'
Assert-True ($webhook.Status -eq 400) "Unsigned webhook did not fail closed."
Write-Output "OK webhook signature gate"

foreach ($provider in @("google", "apple")) {
  $result = Invoke-WebRequest -Uri "$BaseUrl/api/auth/${provider}?next=%2Fprofile" -UseBasicParsing -TimeoutSec 30
  Assert-True ($result.StatusCode -eq 200) "$provider OAuth fallback did not render the login page."
  Assert-True (([string]$result.BaseResponse.ResponseUri.AbsolutePath) -eq "/login") "$provider OAuth disabled state did not return safely to login."
  Write-Output "OK $provider OAuth safe gate"
}

Write-Output "Live production smoke passed."
