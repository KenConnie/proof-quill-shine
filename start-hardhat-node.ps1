# Start Hardhat Node Script
# This script starts a Hardhat node with FHEVM support

Write-Host "Starting Hardhat node..." -ForegroundColor Green
Write-Host "This will start a local blockchain node on http://localhost:8545" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the node" -ForegroundColor Yellow
Write-Host ""

# Start Hardhat node
npx hardhat node

