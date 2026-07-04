# Kill existing process on port 3000
$proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($proc) {
  Stop-Process -Id $proc -Force
  Write-Host "✓ Killed existing process"
  Start-Sleep -Seconds 2
}

# Start backend
Write-Host "🚀 Starting backend..."
npm start
