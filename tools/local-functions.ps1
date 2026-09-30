$ErrorActionPreference = "Stop"

function Stop-LocalFunctionServers {
  param(
    [switch]$RemoveEdgeRuntime
  )

  $processes = Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine -like "*supabase functions serve*"
    }

  foreach ($process in $processes) {
    try {
      Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
      Write-Host "Stopped lingering Supabase functions process pid=$($process.ProcessId)"
    } catch {
      Write-Host "Could not stop Supabase functions process pid=$($process.ProcessId): $($_.Exception.Message)"
    }
  }

  if ($RemoveEdgeRuntime) {
    $container = docker ps -a --format "{{.Names}}" 2>$null |
      Where-Object { $_ -eq "supabase_edge_runtime_ViralBox" } |
      Select-Object -First 1

    if ($container) {
      docker rm -f supabase_edge_runtime_ViralBox 2>$null | Out-Null
      Write-Host "Removed stale edge runtime container supabase_edge_runtime_ViralBox"
    }
  }
}
