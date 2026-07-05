# Start Think Decision (Backend + Frontend)
# Backend : Node/Express di .\backend (port 3000)
# Frontend: static server di .\frontend (port 8000)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Starting Think Decision" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

# Kill port 3000 if in use
$proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($proc) {
  Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
  Write-Host "Cleared port 3000" -ForegroundColor Yellow
  Start-Sleep -Seconds 1
}

# Kill port 8000 if in use
$proc = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($proc) {
  Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
  Write-Host "Cleared port 8000" -ForegroundColor Yellow
  Start-Sleep -Seconds 1
}

# Start Backend
Write-Host "`nStarting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; python -m http.server 8000"
Start-Sleep -Seconds 2

Write-Host "`nBackend : http://localhost:3000 (health: /health)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8000/DecideAI.html" -ForegroundColor Green
