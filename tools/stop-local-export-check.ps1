$targets = Get-CimInstance Win32_Process |
  Where-Object {
    $_.ProcessId -ne $PID -and
    $_.CommandLine -and
    $_.CommandLine -like "*export-production-finalists.ps1*"
  }

foreach ($target in $targets) {
  Stop-Process -Id $target.ProcessId -Force
  Write-Output "Stopped local finalist audit process $($target.ProcessId)."
}