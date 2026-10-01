$process = Start-Process `\
  -FilePath "npm.cmd" `\
  -ArgumentList @("run", "start", "--", "-p", "3011") `\
  -WorkingDirectory "C:\\\\Users\\\\Kagan\\\\OneDrive\\\\Desktop\\\\ViralBox" `\
  -WindowStyle Hidden `\
  -PassThru\
\
Write-Output $process.Id\