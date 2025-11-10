# PowerShell script to reset Hardhat node for demo recording
# This script will:
# 1. Stop all Hardhat node processes
# 2. Clear deployment files
# 3. Provide instructions for restarting

Write-Host "=== Resetting Test Data ===" -ForegroundColor Green
Write-Host ""

# Step 1: Stop all Hardhat node processes
Write-Host "Step 1: Stopping Hardhat node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*node.exe*" 
}

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) node process(es), stopping..." -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process $($_.Id)" -ForegroundColor Gray
        } catch {
            Write-Host "  Could not stop process $($_.Id): $_" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  No Hardhat node processes found" -ForegroundColor Gray
}

# Step 2: Clear deployment files
Write-Host ""
Write-Host "Step 2: Clearing deployment files..." -ForegroundColor Yellow
if (Test-Path "deployments\localhost") {
    $files = Get-ChildItem -Path "deployments\localhost" -Filter "*.json" -Exclude "solcInputs"
    if ($files) {
        $files | Remove-Item -Force
        Write-Host "  Removed $($files.Count) deployment file(s)" -ForegroundColor Gray
    } else {
        Write-Host "  No deployment files to remove" -ForegroundColor Gray
    }
} else {
    Write-Host "  No deployments directory found" -ForegroundColor Gray
}

# Step 3: Clear cache
Write-Host ""
Write-Host "Step 3: Clearing cache..." -ForegroundColor Yellow
if (Test-Path "cache") {
    Remove-Item -Path "cache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Cache cleared" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Reset Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open a NEW terminal and start Hardhat node:" -ForegroundColor Cyan
Write-Host "   cd proof-quill-shine" -ForegroundColor White
Write-Host "   npx hardhat node" -ForegroundColor White
Write-Host ""
Write-Host "2. Wait for 'Started HTTP and WebSocket JSON-RPC server' message" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. In ANOTHER terminal, deploy contracts:" -ForegroundColor Cyan
Write-Host "   cd proof-quill-shine" -ForegroundColor White
Write-Host "   npx hardhat deploy --network localhost" -ForegroundColor White
Write-Host ""
Write-Host "4. Copy the EncryptedTravelCounter contract address from the output" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Update ui/.env.local with the new contract address:" -ForegroundColor Yellow
Write-Host "   VITE_CONTRACT_ADDRESS=<new_address>" -ForegroundColor White
Write-Host ""
Write-Host "6. Clear browser storage (F12 -> Application -> Clear storage)" -ForegroundColor Yellow
Write-Host ""
Write-Host "7. Refresh your browser and connect wallet" -ForegroundColor Yellow
Write-Host ""

