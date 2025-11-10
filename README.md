# TravelProof - Encrypted Travel Counter

A privacy-preserving travel country counter built with FHEVM (Fully Homomorphic Encryption Virtual Machine) that allows users to securely record and accumulate encrypted country counts on-chain. Individual counts remain private, and only the user can decrypt and view their total.

## 🌐 Live Demo

- **Live Demo**: [https://proof-quill-shine.vercel.app/](https://proof-quill-shine.vercel.app/)
- **Demo Video**: [https://github.com/KenConnie/proof-quill-shine/blob/main/proof-quill-shine.mp4](https://github.com/KenConnie/proof-quill-shine/blob/main/proof-quill-shine.mp4)

## Features

- **🔒 Encrypted Country Count**: Users record only the number of countries visited, not specific locations
- **➕ FHE Accumulation**: Contract performs encrypted addition on-chain using Fully Homomorphic Encryption
- **🔐 Private Decryption**: Only the user can decrypt and view their total count
- **💼 Rainbow Wallet Integration**: Seamless wallet connection using RainbowKit
- **🌐 Multi-Network Support**: Works on local Hardhat network and Sepolia testnet
- **📱 PWA Support**: Progressive Web App with custom icons and manifest

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm** or **yarn/pnpm**: Package manager
- **Rainbow Wallet**: Browser extension installed

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd ui && npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile contracts**

   ```bash
   npm run compile
   npm run typechain
   ```

4. **Deploy to local network**

   ```bash
   # Terminal 1: Start a local FHEVM-ready node
   npx hardhat node

   # Terminal 2: Deploy to local network
   npx hardhat deploy --network localhost

   # Copy the deployed contract address and update ui/.env.local
   # VITE_CONTRACT_ADDRESS=0x...
   ```

5. **Start frontend**

   ```bash
   cd ui
   npm run dev
   ```

6. **Connect wallet and test**

   - Open the app in your browser
   - Connect wallet to localhost network (Chain ID: 31337)
   - Add countries to your encrypted counter
   - Decrypt your count to verify encryption/decryption

7. **Deploy to Sepolia Testnet** (after local testing)

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   
   # Update VITE_CONTRACT_ADDRESS in ui/.env.local with Sepolia address
   
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

## Project Structure

```
proof-quill-shine/
├── contracts/                           # Smart contract source files
│   └── EncryptedTravelCounter.sol      # Main travel counter contract
├── deploy/                              # Deployment scripts
│   └── 001_deploy_EncryptedTravelCounter.ts
├── test/                                # Test files
│   ├── EncryptedTravelCounter.ts       # Local network tests
│   └── EncryptedTravelCounterSepolia.ts # Sepolia testnet tests
├── ui/                                  # Frontend React application
│   ├── src/
│   │   ├── components/                 # React components
│   │   │   ├── JourneyLogger.tsx       # Add countries component
│   │   │   ├── CountryCounter.tsx      # View and decrypt component
│   │   │   └── ui/                     # shadcn/ui components
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useTravelCounter.tsx    # Main contract interaction hook
│   │   │   └── useFhevm.tsx            # FHEVM instance management
│   │   ├── fhevm/                      # FHEVM utilities
│   │   │   ├── RelayerSDKLoader.ts     # SDK loader
│   │   │   ├── PublicKeyStorage.ts     # Public key management
│   │   │   └── internal/               # Internal FHEVM logic
│   │   └── pages/                      # Page components
│   └── public/                         # Static assets
│       ├── favicon.svg                 # App icon
│       ├── logo.png                    # App logo
│       └── manifest.json               # PWA manifest
├── hardhat.config.ts                   # Hardhat configuration
└── package.json                        # Dependencies and scripts
```

## Smart Contract

### EncryptedTravelCounter.sol

The main smart contract that handles encrypted country count storage and accumulation using FHEVM.

#### Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedTravelCounter is SepoliaConfig {
    // Mapping from user address to their encrypted country count
    mapping(address => euint32) private _encryptedCountryCounts;
    
    // Mapping to track if user has initialized their counter
    mapping(address => bool) private _hasInitialized;

    event CountryCountAdded(address indexed user, uint256 timestamp);

    /// @notice Add countries to user's encrypted count
    /// @param encryptedCountryCount The encrypted number of countries to add
    /// @param inputProof The FHE input proof for verification
    function addCountries(externalEuint32 encryptedCountryCount, bytes calldata inputProof) external {
        euint32 countryCount = FHE.fromExternal(encryptedCountryCount, inputProof);
        
        // Initialize if first time
        if (!_hasInitialized[msg.sender]) {
            _encryptedCountryCounts[msg.sender] = countryCount;
            _hasInitialized[msg.sender] = true;
        } else {
            // Add to existing count using FHE addition
            _encryptedCountryCounts[msg.sender] = FHE.add(
                _encryptedCountryCounts[msg.sender],
                countryCount
            );
        }

        // Grant decryption permissions to the user
        FHE.allowThis(_encryptedCountryCounts[msg.sender]);
        FHE.allow(_encryptedCountryCounts[msg.sender], msg.sender);

        emit CountryCountAdded(msg.sender, block.timestamp);
    }

    /// @notice Get the encrypted country count for a user
    /// @param user The user address
    /// @return encryptedCount The encrypted country count
    function getEncryptedCountryCount(address user) external view returns (euint32 encryptedCount) {
        return _encryptedCountryCounts[user];
    }

    /// @notice Check if a user has initialized their counter
    /// @param user The user address
    /// @return Whether the user has initialized
    function hasInitialized(address user) external view returns (bool) {
        return _hasInitialized[user];
    }
}
```

#### Key Functions

- **`addCountries(externalEuint32 encryptedCountryCount, bytes calldata inputProof)`**: 
  - Accepts encrypted country count and input proof
  - Converts external encrypted value to internal `euint32` using `FHE.fromExternal()`
  - Initializes or accumulates encrypted count using `FHE.add()`
  - Grants decryption permissions to the user with `FHE.allow()`
  - Emits `CountryCountAdded` event

- **`getEncryptedCountryCount(address user)`**: 
  - Returns the encrypted `euint32` count for a user
  - Can be called by anyone (view function)
  - Returns encrypted handle that only the user can decrypt

- **`hasInitialized(address user)`**: 
  - Checks if a user has added countries at least once
  - Returns `bool` indicating initialization status

## Encryption & Decryption Logic

### Encryption Flow

1. **Client-Side Encryption**:
   ```typescript
   // Create encrypted input using FHEVM instance
   const encryptedInput = fhevmInstance.createEncryptedInput(
     contractAddress,
     userAddress
   );
   
   // Add the plaintext value (country count)
   encryptedInput.add32(count);
   
   // Encrypt and get handle + proof
   const encrypted = await encryptedInput.encrypt();
   // Returns: { handles: string[], inputProof: string }
   ```

2. **On-Chain Submission**:
   ```typescript
   // Submit encrypted handle and proof to contract
   const tx = await contract.addCountries(
     encrypted.handles[0],      // Encrypted handle
     encrypted.inputProof      // Cryptographic proof
   );
   ```

3. **Contract Processing**:
   - Contract verifies the input proof
   - Converts external encrypted value to internal `euint32`
   - Performs encrypted addition: `FHE.add(existingCount, newCount)`
   - Grants decryption permissions: `FHE.allow(encryptedValue, user)`

### Decryption Flow

1. **Get Encrypted Handle**:
   ```typescript
   // Fetch latest encrypted count from contract
   const encryptedCount = await contract.getEncryptedCountryCount(userAddress);
   const handle = ethers.hexlify(encryptedCount);
   ```

2. **Generate Decryption Keypair**:
   ```typescript
   // Generate keypair for EIP712 signature
   const keypair = fhevmInstance.generateKeypair();
   ```

3. **Create EIP712 Signature**:
   ```typescript
   // Create EIP712 typed data for decryption request
   const eip712 = fhevmInstance.createEIP712(
     keypair.publicKey,
     [contractAddress],
     startTimestamp,
     durationDays
   );
   
   // Sign with user's wallet
   const signature = await signer.signTypedData(
     eip712.domain,
     { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
     eip712.message
   );
   ```

4. **Decrypt**:
   ```typescript
   // For local network, remove "0x" prefix from signature
   const signatureForDecrypt = chainId === 31337 
     ? signature.replace("0x", "") 
     : signature;
   
   // Decrypt using FHEVM instance
   const decryptedResult = await fhevmInstance.userDecrypt(
     [{ handle, contractAddress }],
     keypair.privateKey,
     keypair.publicKey,
     signatureForDecrypt,
     [contractAddress],
     userAddress,
     startTimestamp,
     durationDays
   );
   
   // Extract decrypted value
   const decryptedCount = Number(decryptedResult[handle] || 0);
   ```

### Key Encryption/Decryption Details

#### Encryption Type
- **`euint32`**: Encrypted 32-bit unsigned integer
- **`externalEuint32`**: External format for passing encrypted values as function parameters
- **Handle Format**: 66 characters (0x + 64 hex characters)

#### FHE Operations
- **`FHE.fromExternal()`**: Converts external encrypted value to internal format
- **`FHE.add()`**: Performs encrypted addition on-chain
- **`FHE.allow()`**: Grants decryption permissions to specific addresses
- **`FHE.allowThis()`**: Grants decryption permission to the contract itself

#### Permission Model
- Only the contract and the user can decrypt encrypted values
- Permissions are set automatically when data is added
- Each encrypted value has its own permission set
- Permissions persist across transactions

#### Network-Specific Behavior
- **Localhost (31337)**: Uses `@fhevm/mock-utils` for local testing
  - Signature format: Remove "0x" prefix
  - No relayer required
- **Sepolia (11155111)**: Uses `@zama-fhe/relayer-sdk` with Zama's FHE relayer
  - Signature format: Keep "0x" prefix
  - Requires relayer for decryption

## Frontend Usage

### Components

1. **JourneyLogger**: 
   - Input field for country count
   - Encrypts and submits to contract
   - Shows transaction status

2. **CountryCounter**: 
   - Displays encrypted count (as handle)
   - Decrypt button to view decrypted total
   - Refresh button to reload latest count

### Workflow

1. **Connect Wallet**: Click Rainbow wallet button in top right
2. **Add Countries**: 
   - Enter number of countries (e.g., 5)
   - Click "Add Countries"
   - Wait for transaction confirmation
3. **View Encrypted Count**: Encrypted handle is displayed
4. **Decrypt Count**: 
   - Click "Decrypt Count" button
   - Sign EIP712 message with wallet
   - View decrypted total

## Testing

### Local Network Testing

```bash
# Start local Hardhat node with FHEVM support
npx hardhat node

# In another terminal, run tests
npm run test
```

Tests verify:
- Initialization state
- Encrypted addition
- Accumulation of multiple additions
- User isolation (separate counts per user)
- Decryption functionality

### Sepolia Testnet Testing

```bash
# Deploy contract first
npx hardhat deploy --network sepolia

# Then run Sepolia-specific tests
npm run test:sepolia
```

## Technical Details

### FHEVM Integration

- **SDK Loading**: Dynamically loads FHEVM Relayer SDK from CDN
- **Instance Creation**: Creates FHEVM instance based on network (mock for local, relayer for Sepolia)
- **Public Key Storage**: Uses IndexedDB to cache public keys and parameters
- **Decryption Signatures**: Uses in-memory storage for EIP712 signatures

### Security Features

1. **Input Proof Verification**: All encrypted inputs include cryptographic proofs verified by the contract
2. **Access Control**: Only authorized parties (contract and user) can decrypt encrypted values
3. **Privacy Preservation**: Actual country counts are never revealed on-chain
4. **EIP712 Signatures**: Decryption requests require cryptographic signatures to prevent unauthorized access

### Network Support

- **Localhost (31337)**: For development and testing with mock FHEVM
- **Sepolia Testnet (11155111)**: For public testing with Zama FHE relayer
- **Mainnet**: Ready for production deployment (with proper configuration)

## Reset for Demo

To clear all test data and prepare for a fresh demo:

```powershell
# Run reset script
.\reset-for-demo-simple.ps1

# Then manually:
# 1. Start Hardhat node: npx hardhat node
# 2. Deploy contracts: npx hardhat deploy --network localhost
# 3. Update ui/.env.local with new contract address
# 4. Clear browser storage and refresh
```

## License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using [Zama FHEVM](https://docs.zama.ai/fhevm)**
