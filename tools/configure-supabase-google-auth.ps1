param(
  [string]$ProjectRef = "psqqqhcfmfojrqsvzzzb",
  [string]$GoogleOAuthFile = "C:\Users\Kagan\AppData\Local\Temp\anomaa.txt",
  [string]$SupabasePatFile = "C:\Users\Kagan\AppData\Local\Temp\anomaly-supabase-pat.txt"
)

$ErrorActionPreference = "Stop"

function Read-SecretFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing file: $Path"
  }
  return (Get-Content -LiteralPath $Path -Raw).Trim()
}

$googleText = Read-SecretFile $GoogleOAuthFile

$clientId = $null
$clientSecret = $null

if ($googleText -match '(?m)^\s*GOOGLE_OAUTH_CLIENT_ID\s*=\s*"?([^"\r\n\s]+)"?\s*$') {
  $clientId = $Matches[1]
}
if (-not $clientId -and $googleText -match '([A-Za-z0-9_-]+\.apps\.googleusercontent\.com)') {
  $clientId = $Matches[1]
}

if ($googleText -match '(?m)^\s*GOOGLE_OAUTH_CLIENT_SECRET\s*=\s*"?([^"\r\n\s]+)"?\s*$') {
  $clientSecret = $Matches[1]
}
if (-not $clientSecret -and $googleText -match '(GOCSPX-[A-Za-z0-9_-]+)') {
  $clientSecret = $Matches[1]
}

if (-not $clientId -or -not $clientSecret) {
  throw "Google OAuth file must contain a web client ID and client secret."
}

$supabaseToken = $env:SUPABASE_ACCESS_TOKEN
if (-not $supabaseToken) {
  $supabaseToken = Read-SecretFile $SupabasePatFile
}

$body = @{
  external_google_enabled = $true
  external_google_client_id = $clientId
  external_google_secret = $clientSecret
} | ConvertTo-Json -Compress

$headers = @{
  Authorization = "Bearer $supabaseToken"
  "Content-Type" = "application/json"
}

$endpoint = "https://api.supabase.com/v1/projects/$ProjectRef/config/auth"
$response = Invoke-RestMethod -Method Patch -Uri $endpoint -Headers $headers -Body $body

[pscustomobject]@{
  ProjectRef = $ProjectRef
  GoogleProvider = "enabled"
  ClientIdDetected = $true
  SecretDetected = $true
  UpdatedAt = (Get-Date).ToUniversalTime().ToString("s") + "Z"
} | ConvertTo-Json -Compress
