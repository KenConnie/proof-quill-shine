# PowerShell script to start Hardhat node and deploy contracts
# This script will:
# 1. Start Hardhat node in background
# 2. Wait for it to be ready
# 3. Deploy contracts
# 4. Show contract addresses and update instructions

Write-Host "=== Starting Hardhat Node and Deploying Contracts ===" -ForegroundColor Green
Write-Host ""

# Check if Hardhat node is already running
$nodeRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST `
        -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' `
        -ContentType "application/json" -ErrorAction SilentlyContinue -TimeoutSec 2
    
    if ($response.StatusCode -eq 200) {
        $nodeRunning = $true
        Write-Host "Hardhat node is already running" -ForegroundColor Yellow
    }
} catch {
    # Node not running, continue
}

if (-not $nodeRunning) {
    Write-Host "Starting Hardhat node in background..." -ForegroundColor Yellow
    Write-Host "This may take a few seconds..." -ForegroundColor Gray
    
    # Start Hardhat node in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx hardhat node" -WindowStyle Minimized
    
    Write-Host "Waiting for Hardhat node to start..." -ForegroundColor Yellow
    
    # Wait for node to be ready
    $maxAttempts = 30
    $attempt = 0
    $nodeReady = $false
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST `
                -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' `
                -ContentType "application/json" -ErrorAction SilentlyContinue -TimeoutSec 2
            
            if ($response.StatusCode -eq 200) {
                $nodeReady = $true
                break
            }
        } catch {
            # Node not ready yet
        }
        
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    }
    
    if (-not $nodeReady) {
        Write-Host ""
        Write-Host "ERROR: Hardhat node did not start within $maxAttempts seconds" -ForegroundColor Red
        Write-Host "Please start Hardhat node manually in a new terminal:" -ForegroundColor Yellow
        Write-Host "  npx hardhat node" -ForegroundColor White
        exit 1
    }
    
    Write-Host "  Hardhat node is ready!" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Deploy contracts
Write-Host ""
Write-Host "Deploying contracts..." -ForegroundColor Yellow
$deployOutput = npx hardhat deploy --network localhost 2>&1

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
        
        # Check if .env.local exists
        $envLocalPath = "ui\.env.local"
        if (Test-Path $envLocalPath) {
            Write-Host "Updating ui/.env.local..." -ForegroundColor Yellow
            $envContent = Get-Content $envLocalPath -Raw
            if ($envContent -match "VITE_CONTRACT_ADDRESS=.*") {
                $envContent = $envContent -replace "VITE_CONTRACT_ADDRESS=.*", "VITE_CONTRACT_ADDRESS=$contractAddress"
            } else {
                $envContent += "`nVITE_CONTRACT_ADDRESS=$contractAddress`n"
            }
            Set-Content -Path $envLocalPath -Value $envContent
            Write-Host "  ✅ Updated ui/.env.local" -ForegroundColor Green
        } else {
            Write-Host "Creating ui/.env.local..." -ForegroundColor Yellow
            $envDir = Split-Path $envLocalPath
            if (-not (Test-Path $envDir)) {
                New-Item -ItemType Directory -Path $envDir -Force | Out-Null
            }
            $envContent = @"
# Contract Address (from localhost deployment)
VITE_CONTRACT_ADDRESS=$contractAddress

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
# VITE_WALLETCONNECT_PROJECT_ID=your_project_id
"@
            Set-Content -Path $envLocalPath -Value $envContent
            Write-Host "  ✅ Created ui/.env.local" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Clear browser storage:" -ForegroundColor White
        Write-Host "   - Press F12 to open Developer Tools" -ForegroundColor Gray
        Write-Host "   - Go to Application tab" -ForegroundColor Gray
        Write-Host "   - Click 'Clear storage'" -ForegroundColor Gray
        Write-Host "   - Click 'Clear site data'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Refresh your browser page" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Connect your Rainbow wallet to localhost network (Chain ID: 31337)" -ForegroundColor White
        Write-Host ""
        Write-Host "4. Add countries and test decryption!" -ForegroundColor White
        Write-Host ""
        Write-Host "Note: Hardhat node is running in a minimized window." -ForegroundColor Gray
        Write-Host "      To stop it, close that window or run: Get-Process node | Stop-Process" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: Contract deployment file not found" -ForegroundColor Yellow
        Write-Host "Please check the deployment output above for the contract address" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Contract deployment failed" -ForegroundColor Red
    Write-Host $deployOutput
    exit 1
}

