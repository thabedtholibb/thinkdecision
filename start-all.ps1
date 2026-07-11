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
Write-Host ""
Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Wait for the backend to actually answer /health instead of guessing with a
# fixed sleep - a slow npm install / cold start could otherwise leave the
# frontend pointing at a backend that isn't up yet.
Write-Host "Waiting for backend health check..." -ForegroundColor Yellow
$maxWaitSeconds = 30
$waited = 0
$healthy = $false
while ($waited -lt $maxWaitSeconds) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      $healthy = $true
      break
    }
  } catch {
    # Not up yet - keep polling.
  }
  Start-Sleep -Seconds 1
  $waited += 1
}
if ($healthy) {
  Write-Host "Backend is healthy (${waited}s)" -ForegroundColor Green
} else {
  Write-Host "Backend did not become healthy within ${maxWaitSeconds}s - check the backend window for errors." -ForegroundColor Red
}

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; python -m http.server 8000"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Backend : http://localhost:3000 (health: /health)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8000/DecideAI.html" -ForegroundColor Green
