import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "./useInMemoryStorage";

// Contract ABI
const EncryptedTravelCounterABI = [
  "function addCountries(bytes32 encryptedCountryCount, bytes calldata inputProof) external",
  "function getEncryptedCountryCount(address user) external view returns (bytes32)",
  "function hasInitialized(address user) external view returns (bool)",
  "event CountryCountAdded(address indexed user, uint256 timestamp)",
];

interface UseTravelCounterState {
  contractAddress: string | undefined;
  encryptedCount: string | undefined;
  decryptedCount: number | undefined;
  isLoading: boolean;
  message: string | undefined;
  addCountries: (count: number) => Promise<void>;
  decryptCount: () => Promise<void>;
  loadEncryptedCount: () => Promise<void>;
}

export function useTravelCounter(contractAddress: string | undefined): UseTravelCounterState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const [encryptedCount, setEncryptedCount] = useState<string | undefined>(undefined);
  const [decryptedCount, setDecryptedCount] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  const addCountries = useCallback(
    async (count: number) => {
      console.log("[useTravelCounter] addCountries called", {
        count,
        contractAddress,
        hasEthersSigner: !!ethersSigner,
        hasFhevmInstance: !!fhevmInstance,
        address,
        hasEthersProvider: !!ethersProvider,
      });

      if (!contractAddress) {
        const error = new Error("Contract address not configured. Please set VITE_CONTRACT_ADDRESS in .env.local");
        setMessage(error.message);
        console.error("[useTravelCounter] Missing contract address");
        throw error;
      }

      if (!ethersSigner) {
        const error = new Error("Wallet signer not available. Please ensure your wallet is connected.");
        setMessage(error.message);
        console.error("[useTravelCounter] Missing ethers signer");
        throw error;
      }

      if (!fhevmInstance) {
        const error = new Error("FHEVM instance not initialized. Please wait for initialization.");
        setMessage(error.message);
        console.error("[useTravelCounter] Missing FHEVM instance");
        throw error;
      }

      if (!address) {
        const error = new Error("Wallet address not available. Please connect your wallet.");
        setMessage(error.message);
        console.error("[useTravelCounter] Missing address");
        throw error;
      }

      if (!ethersProvider) {
        const error = new Error("Ethers provider not available.");
        setMessage(error.message);
        console.error("[useTravelCounter] Missing ethers provider");
        throw error;
      }

      if (count < 1) {
        const error = new Error("Country count must be at least 1");
        setMessage(error.message);
        throw error;
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting country count...");
        console.log("[useTravelCounter] Starting encryption...");

        // Encrypt count using FHEVM
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(count);
        const encrypted = await encryptedInput.encrypt();
        console.log("[useTravelCounter] Encryption complete", {
          hasHandles: !!encrypted.handles && encrypted.handles.length > 0,
          hasInputProof: !!encrypted.inputProof && encrypted.inputProof.length > 0,
        });

        setMessage("Submitting to blockchain...");

        // Verify contract is deployed
        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          throw new Error(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        }

        const contract = new ethers.Contract(contractAddress, EncryptedTravelCounterABI, ethersSigner);

        const encryptedCountHandle = encrypted.handles[0];
        if (!encryptedCountHandle || !encrypted.inputProof || encrypted.inputProof.length === 0) {
          throw new Error("Encryption failed - missing handle or proof");
        }

        console.log("[useTravelCounter] Submitting transaction...");
        const tx = await contract.addCountries(
          encryptedCountHandle,
          encrypted.inputProof,
          {
            gasLimit: 5000000,
          }
        );
        console.log("[useTravelCounter] Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("[useTravelCounter] Transaction confirmed, block:", receipt.blockNumber);

        setMessage("Countries added successfully. Refreshing encrypted count...");
        
        // Wait a bit for the state to be fully updated and permissions to be set
        console.log("[useTravelCounter] Waiting for state update and permissions...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
        
        // Reload encrypted count after successful addition
        if (contractAddress && ethersProvider && address) {
          try {
            const contractCode = await ethersProvider.getCode(contractAddress);
            if (contractCode && contractCode.length > 2) {
              const contract = new ethers.Contract(contractAddress, EncryptedTravelCounterABI, ethersProvider);
              const hasInit = await contract.hasInitialized(address);
              if (hasInit) {
                const encrypted = await contract.getEncryptedCountryCount(address);
                const handle = typeof encrypted === "string" ? encrypted : ethers.hexlify(encrypted);
                const normalizedHandle = handle.toLowerCase();
                console.log("[useTravelCounter] ===== Post-Add Refresh =====");
                console.log("[useTravelCounter] New encrypted count handle:", normalizedHandle);
                console.log("[useTravelCounter] Handle length:", normalizedHandle.length);
                setEncryptedCount(normalizedHandle);
                setMessage("Countries added successfully! Wait a moment, then you can decrypt your count.");
              } else {
                console.warn("[useTravelCounter] User not initialized after adding countries");
                setMessage("Countries added, but initialization check failed. Please try refreshing.");
              }
            }
          } catch (err) {
            console.error("[useTravelCounter] Error reloading count:", err);
            setMessage("Countries added, but failed to refresh count. Please refresh manually.");
          }
        }
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useTravelCounter] Error adding countries:", error);
        throw error; // Re-throw so component can catch it
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const decryptCount = useCallback(
    async () => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        return;
      }

      try {
        setMessage("Checking permissions and fetching latest encrypted count...");

        // First, verify user has initialized and get the latest encrypted count from contract
        const contract = new ethers.Contract(contractAddress, EncryptedTravelCounterABI, ethersProvider);
        const hasInit = await contract.hasInitialized(address);
        
        if (!hasInit) {
          throw new Error("You haven't added any countries yet. Please add countries first before decrypting.");
        }

        // Get the latest encrypted count from contract (not from state, to ensure it's current)
        const latestEncryptedCount = await contract.getEncryptedCountryCount(address);
        let handle = typeof latestEncryptedCount === "string" ? latestEncryptedCount : ethers.hexlify(latestEncryptedCount);

        // Normalize handle format
        if (handle && handle.startsWith("0x")) {
          handle = handle.toLowerCase();
        }

        if (!handle || handle === "0x" || handle.length !== 66) {
          throw new Error(`Invalid handle format: ${handle}. Expected 66 characters (0x + 64 hex chars)`);
        }

        console.log("[useTravelCounter] ===== Decryption Debug Info =====");
        console.log("[useTravelCounter] Handle from contract:", handle);
        console.log("[useTravelCounter] Handle length:", handle.length);
        console.log("[useTravelCounter] Contract address:", contractAddress);
        console.log("[useTravelCounter] User address:", address);
        console.log("[useTravelCounter] Chain ID:", chainId);
        console.log("[useTravelCounter] FHEVM instance type:", fhevmInstance?.constructor?.name);
        
        // Check if this handle matches what we have in state
        if (encryptedCount && encryptedCount.toLowerCase() !== handle.toLowerCase()) {
          console.warn("[useTravelCounter] WARNING: Handle mismatch!");
          console.warn("[useTravelCounter] State handle:", encryptedCount);
          console.warn("[useTravelCounter] Contract handle:", handle);
          console.warn("[useTravelCounter] Using contract handle (latest)");
        }

        // Update state with latest handle
        setEncryptedCount(handle);

        setMessage("Decrypting country count...");

        // Prepare handle-contract pairs
        const handleContractPairs = [
          { handle, contractAddress: contractAddress as `0x${string}` },
        ];

        // Generate keypair for EIP712 signature
        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        // Create EIP712 signature for decryption
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        // Sign the EIP712 message
        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        // For local mock network, signature may need to have "0x" prefix removed
        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        console.log("[useTravelCounter] Decrypting with:", {
          handle,
          contractAddress,
          userAddress: address,
          chainId,
          signatureLength: signature.length,
          signatureForDecryptLength: signatureForDecrypt.length,
        });

        // Decrypt using userDecrypt method
        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        const decrypted = Number(decryptedResult[handle] || 0);
        console.log("[useTravelCounter] Decryption successful:", decrypted);
        setDecryptedCount(decrypted);
        setMessage(`Decrypted count: ${decrypted} countries`);
      } catch (error: any) {
        console.error("[useTravelCounter] Error decrypting count:", error);
        const errorMessage = error.message || String(error);
        
        // Provide more helpful error messages
        if (errorMessage.includes("not authorized") || errorMessage.includes("authorized")) {
          setMessage(`Decryption failed: You don't have permission to decrypt this handle. This may happen if:
1. The contract was redeployed and the handle is from an old deployment
2. You haven't added countries yet
3. The transaction hasn't fully confirmed yet

Please try:
1. Add countries again to get a new handle with proper permissions
2. Wait a few seconds after adding countries before decrypting
3. Refresh the page and try again`);
        } else {
          setMessage(`Error decrypting: ${errorMessage}`);
        }
        throw error; // Re-throw so component can handle it
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  const loadEncryptedCount = useCallback(async () => {
    if (!contractAddress || !ethersProvider || !address) {
      return;
    }

    try {
      setIsLoading(true);

      // Check if we can connect to the provider first
      try {
        await ethersProvider.getBlockNumber();
      } catch (providerError: any) {
        if (chainId === 31337) {
          const errorMsg = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
          setMessage(errorMsg);
          console.error("[useTravelCounter] Hardhat node not accessible:", providerError);
          return;
        } else {
          throw providerError;
        }
      }

      const contractCode = await ethersProvider.getCode(contractAddress);
      if (contractCode === "0x" || contractCode.length <= 2) {
        setMessage(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        setEncryptedCount(undefined);
        return;
      }

      const contract = new ethers.Contract(contractAddress, EncryptedTravelCounterABI, ethersProvider);
      const hasInit = await contract.hasInitialized(address);
      
      if (!hasInit) {
        setEncryptedCount(undefined);
        setDecryptedCount(undefined);
        return;
      }

      const encrypted = await contract.getEncryptedCountryCount(address);
      setEncryptedCount(encrypted);
    } catch (error: any) {
      console.error("[useTravelCounter] Error loading encrypted count:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || String(error);
      
      if (error.code === "UNKNOWN_ERROR" || error.code === -32603) {
        if (chainId === 31337) {
          errorMessage = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
        } else {
          errorMessage = `Network error: ${error.message || "Failed to connect to blockchain"}`;
        }
      } else if (error.message?.includes("Failed to fetch")) {
        if (chainId === 31337) {
          errorMessage = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
        } else {
          errorMessage = "Network connection failed. Please check your internet connection and try again.";
        }
      }
      
      setMessage(`Error loading count: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ethersProvider, address, chainId]);

  useEffect(() => {
    if (contractAddress && ethersProvider && address) {
      loadEncryptedCount();
    }
  }, [contractAddress, ethersProvider, address, loadEncryptedCount]);

  return {
    contractAddress,
    encryptedCount,
    decryptedCount,
    isLoading,
    message,
    addCountries,
    decryptCount,
    loadEncryptedCount,
  };
}

