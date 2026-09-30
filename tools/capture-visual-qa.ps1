$ErrorActionPreference = "Stop"

$workspace = [System.IO.Path]::GetFullPath((Get-Location).Path)
$outputRoot = [System.IO.Path]::GetFullPath((Join-Path $workspace "tmp\visual-qa-20260729"))
$chrome = Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"

if (-not $outputRoot.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Visual QA output escaped the workspace."
}
if (-not (Test-Path -LiteralPath $chrome)) {
  throw "Google Chrome is not installed."
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$captures = @(
  @{ Name = "home-desktop"; Url = "https://anomalybox.com/"; Size = "1440,1200" },
  @{ Name = "home-mobile"; Url = "https://anomalybox.com/"; Size = "390,844" },
  @{ Name = "login-desktop"; Url = "https://anomalybox.com/login"; Size = "1440,1000" },
  @{ Name = "login-mobile"; Url = "https://anomalybox.com/login"; Size = "390,844" },
  @{ Name = "store-desktop"; Url = "https://anomalybox.com/store"; Size = "1440,1100" },
  @{ Name = "store-mobile"; Url = "https://anomalybox.com/store"; Size = "390,844" },
  @{ Name = "forgot-desktop"; Url = "https://anomalybox.com/forgot-password"; Size = "1440,900" },
  @{ Name = "reset-mobile"; Url = "https://anomalybox.com/reset-password"; Size = "390,844" }
)

foreach ($capture in $captures) {
  $screenshot = Join-Path $outputRoot "$($capture.Name).png"
  $profile = Join-Path $outputRoot "profile-$($capture.Name)"
  $arguments = @(
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=$($capture.Size)",
    "--user-data-dir=$profile",
    "--screenshot=$screenshot",
    $capture.Url
  )
  $process = Start-Process -FilePath $chrome -ArgumentList $arguments -PassThru -Wait -WindowStyle Hidden
  if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $screenshot)) {
    throw "Chrome capture failed for $($capture.Name)."
  }
  Write-Output $screenshot
}