import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying EncryptedTravelCounter...");
  console.log("Deployer address:", deployer);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  const deployment = await deploy("EncryptedTravelCounter", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: hre.network.name === "hardhat" ? 1 : 3, // More confirmations for testnets/mainnet
  });

  console.log("EncryptedTravelCounter deployed to:", deployment.address);

  // Verify contract code if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: deployment.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Contract verification failed:", error.message);
      console.log("You can verify manually later with: npx hardhat verify --network", hre.network.name, deployment.address);
    }
  }

  // Log important information for frontend setup
  console.log("\n=== Frontend Setup Information ===");
  console.log("VITE_CONTRACT_ADDRESS=" + deployment.address);
  console.log("Network:", hre.network.name);
  console.log("Block explorer:", getExplorerUrl(hre.network.name, deployment.address));
};

function getExplorerUrl(network: string, address: string): string {
  const explorers: { [key: string]: string } = {
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    mainnet: `https://etherscan.io/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    arbitrum: `https://arbiscan.io/address/${address}`,
  };

  return explorers[network] || `Contract deployed on ${network} network`;
}

func.tags = ["EncryptedTravelCounter", "travel"];
export default func;

