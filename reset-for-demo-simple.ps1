# Simple script to reset test data
# Run this script, then manually start Hardhat node in another terminal

Write-Host "=== Clearing Test Data ===" -ForegroundColor Green
Write-Host ""

# Stop Hardhat node processes
Write-Host "Stopping Hardhat node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  Stopped $($nodeProcesses.Count) process(es)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
} else {
    Write-Host "  No node processes found" -ForegroundColor Gray
}

# Clear deployment files
Write-Host ""
Write-Host "Clearing deployment files..." -ForegroundColor Yellow
if (Test-Path "deployments\localhost") {
    $files = Get-ChildItem -Path "deployments\localhost" -Filter "*.json" -Exclude "solcInputs"
    if ($files) {
        $files | Remove-Item -Force
        Write-Host "  Removed $($files.Count) file(s)" -ForegroundColor Gray
    }
}

# Clear cache
Write-Host ""
Write-Host "Clearing cache..." -ForegroundColor Yellow
if (Test-Path "cache") {
    Remove-Item -Path "cache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Cache cleared" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Ready for Fresh Start ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open a NEW terminal and run: npx hardhat node" -ForegroundColor White
Write-Host "2. Wait for 'Started HTTP and WebSocket JSON-RPC server' message" -ForegroundColor White
Write-Host "3. In THIS terminal, run: npx hardhat deploy --network localhost" -ForegroundColor White
Write-Host "4. Update ui/.env.local with the new EncryptedTravelCounter address" -ForegroundColor White
Write-Host "5. Clear browser storage (F12 -> Application -> Clear storage -> Clear site data)" -ForegroundColor White
Write-Host "6. Refresh your browser and start fresh!" -ForegroundColor White
Write-Host ""

