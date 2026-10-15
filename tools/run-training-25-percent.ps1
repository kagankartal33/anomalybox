<#
.SYNOPSIS
Runs the LoRA training script restricting CPU usage to exactly 25% of available logical processors.
#>

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " STARTING LORA TRAINING WITH 25% RESOURCE LIMIT" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Calculate how many processors to use
$totalProcessors = $env:NUMBER_OF_PROCESSORS
$targetProcessors = [Math]::Max(1, [Math]::Floor($totalProcessors / 4))

Write-Host "System Logical Processors: $totalProcessors"
Write-Host "Allocated Processors (25%): $targetProcessors"

# 2. Create the Bitmask for Processor Affinity
# E.g., for 1 processor it's 1 (2^0), for 2 it's 3 (2^0 + 2^1), etc.
$affinityMask = 0
for ($i = 0; $i -lt $targetProcessors; $i++) {
    $affinityMask += [Math]::Pow(2, $i)
}

Write-Host "Processor Affinity Mask: $affinityMask"

# 3. Start the Python Process
$scriptPath = Join-Path $PSScriptRoot "train-lora.py"
Write-Host "Starting Python script: $scriptPath"

# Use Start-Process with NoNewWindow to keep output in current console,
# and PassThru so we can modify the process affinity.
$process = Start-Process -FilePath "python" -ArgumentList "`"$scriptPath`"" -PassThru -NoNewWindow

try {
    # Apply the Affinity and Priority to throttle it
    $process.ProcessorAffinity = [IntPtr][int]$affinityMask
    $process.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal
    Write-Host "Successfully applied 25% CPU throttle and BelowNormal priority to PID: $($process.Id)" -ForegroundColor Green
    
    # Wait for completion
    $process.WaitForExit()
    
    if ($process.ExitCode -eq 0) {
        Write-Host "Training completed successfully." -ForegroundColor Green
    } else {
        Write-Host "Training failed with exit code $($process.ExitCode)." -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to apply affinity or priority: $_" -ForegroundColor Red
}
