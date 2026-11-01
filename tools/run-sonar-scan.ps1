[CmdletBinding()]
param(
    [ValidateSet("local", "cloud", "custom")]
    [string]$Target = "local",
    [string]$Token = $env:SONAR_TOKEN,
    [string]$Organization = $env:SONAR_ORGANIZATION,
    [string]$ProjectKey = "anomaly-box",
    [string]$HostUrl = "",
    [switch]$DryRun
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      ViralBox Sonar Scanner Runner      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($Target -eq "local") {
    if (-not $HostUrl) {
        $HostUrl = "http://localhost:9000"
    }

    Write-Host "[*] Checking if local SonarQube server is active at $HostUrl..." -ForegroundColor Yellow
    $tcpCheck = $false
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", 9000, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(1500, $false)
        if ($wait -and $client.Connected) {
            $tcpCheck = $true
            $client.EndConnect($iar)
        }
        $client.Close()
    } catch {
        $tcpCheck = $false
    }

    if (-not $tcpCheck) {
        Write-Host "[!] SonarQube is NOT running on $HostUrl." -ForegroundColor Red
        Write-Host ""
        Write-Host "To start SonarQube locally via Docker, run:" -ForegroundColor Yellow
        Write-Host "  docker run -d --name sonarqube -p 9000:9000 sonarqube:community" -ForegroundColor Green
        Write-Host ""
        Write-Host "Or if you want to scan with SonarCloud instead, run:" -ForegroundColor Yellow
        Write-Host "  npm run sonar:cloud" -ForegroundColor Green
        Write-Host "  (Requires `$env:SONAR_TOKEN and `$env:SONAR_ORGANIZATION)" -ForegroundColor Gray
        exit 1
    }

    Write-Host "[+] Local SonarQube detected at $HostUrl." -ForegroundColor Green
} elseif ($Target -eq "cloud") {
    if (-not $HostUrl) {
        $HostUrl = "https://sonarcloud.io"
    }

    if (-not $Organization) {
        Write-Host "[!] SonarCloud requires an organization key." -ForegroundColor Red
        Write-Host "    Provide -Organization <your-org> or set `$env:SONAR_ORGANIZATION." -ForegroundColor Yellow
        exit 1
    }

    if (-not $Token) {
        Write-Host "[!] SonarCloud requires an authentication token." -ForegroundColor Red
        Write-Host "    Provide -Token <your-token> or set `$env:SONAR_TOKEN." -ForegroundColor Yellow
        exit 1
    }
}

$sonarArgs = @(
    "-y",
    "@sonar/scan",
    "-Dsonar.projectKey=$ProjectKey",
    "-Dsonar.host.url=$HostUrl"
)

if ($Organization) {
    $sonarArgs += "-Dsonar.organization=$Organization"
}

if ($Token) {
    $sonarArgs += "-Dsonar.token=$Token"
}

Write-Host "[*] Target Host: $HostUrl" -ForegroundColor Cyan
Write-Host "[*] Project Key: $ProjectKey" -ForegroundColor Cyan
if ($Organization) {
    Write-Host "[*] Organization: $Organization" -ForegroundColor Cyan
}

if ($DryRun) {
    Write-Host "[+] Dry run: npx $($sonarArgs -join ' ')" -ForegroundColor Yellow
    exit 0
}

Write-Host "[*] Launching Sonar Scanner..." -ForegroundColor Green
& npx @sonarArgs
$scanExitCode = $LASTEXITCODE

if ($scanExitCode -eq 0) {
    Write-Host "[+] Sonar scan completed successfully!" -ForegroundColor Green
} else {
    Write-Host "[!] Sonar scan exited with code $scanExitCode." -ForegroundColor Red
}

exit $scanExitCode
