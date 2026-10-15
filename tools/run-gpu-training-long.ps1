<#
.SYNOPSIS
Launches full GPU LoRA training on NVIDIA GeForce RTX 5060 Laptop GPU in the background.
#>

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " LAUNCHING LONG GPU LORA TRAINING (RTX 5060)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot "train-lora.py"
Write-Host "Target script: $scriptPath"

# Run Python on GPU
$process = Start-Process -FilePath "python" -ArgumentList "`"$scriptPath`"" -PassThru -NoNewWindow

Write-Host "GPU Training Process Launched with PID: $($process.Id)" -ForegroundColor Green
Write-Host "The training process is running on NVIDIA RTX 5060 GPU and will process 6,973+ training examples." -ForegroundColor Yellow
