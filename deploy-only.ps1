# Simple script to deploy contracts (assumes Hardhat node is already running)
Write-Host "=== Deploying Contracts ===" -ForegroundColor Green
Write-Host ""

# Check if Hardhat node is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST `
        -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' `
        -ContentType "application/json" -ErrorAction Stop -TimeoutSec 2
    
    if ($response.StatusCode -eq 200) {
        Write-Host "Hardhat node is running ✓" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Hardhat node is not running!" -ForegroundColor Red
    Write-Host "Please start Hardhat node first in a new terminal:" -ForegroundColor Yellow
    Write-Host "  npx hardhat node" -ForegroundColor White
    exit 1
}

# Deploy contracts
Write-Host ""
Write-Host "Deploying contracts..." -ForegroundColor Yellow
npx hardhat deploy --network localhost

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
    Write-Host ""
    
    # Read and display contract address
    if (Test-Path "deployments\localhost\EncryptedTravelCounter.json") {
        $contractData = Get-Content "deployments\localhost\EncryptedTravelCounter.json" | ConvertFrom-Json
        $contractAddress = $contractData.address
        
        Write-Host "EncryptedTravelCounter Contract Address:" -ForegroundColor Cyan
        Write-Host "  $contractAddress" -ForegroundColor White
        Write-Host ""
        
        # Update or create .env.local
        $envLocalPath = "ui\.env.local"
        $envContent = @"
# Contract Address (from localhost deployment)
VITE_CONTRACT_ADDRESS=$contractAddress

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
# VITE_WALLETCONNECT_PROJECT_ID=your_project_id
"@
        
        $envDir = Split-Path $envLocalPath
        if (-not (Test-Path $envDir)) {
            New-Item -ItemType Directory -Path $envDir -Force | Out-Null
        }
        Set-Content -Path $envLocalPath -Value $envContent
        Write-Host "✅ Updated ui/.env.local with contract address" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Clear browser storage (F12 -> Application -> Clear storage)" -ForegroundColor White
        Write-Host "2. Refresh your browser" -ForegroundColor White
        Write-Host "3. Connect wallet and test!" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    exit 1
}

