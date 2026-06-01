# Start Think Decision (Backend + Frontend)
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
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Apps\Think Decision\backend'; npm start"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Thabed Tholib B\Think Decision'; python -m http.server 8000"
Start-Sleep -Seconds 2

Write-Host "`nBoth servers running!" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8000/DecideAI.html" -ForegroundColor Green
Write-Host "`nPress Enter to close this window..." -ForegroundColor Yellow
Read-Host
