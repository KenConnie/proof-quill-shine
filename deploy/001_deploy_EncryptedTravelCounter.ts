import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("EncryptedTravelCounter", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
};

func.tags = ["EncryptedTravelCounter"];
export default func;

