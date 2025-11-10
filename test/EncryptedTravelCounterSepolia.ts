import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedTravelCounter } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedTravelCounterSepolia", function () {
  let signers: Signers;
  let contract: EncryptedTravelCounter;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedTravelCounter");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("EncryptedTravelCounter", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should add countries and decrypt count", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    progress("Encrypting '3' countries...");
    const encryptedThree = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(3)
      .encrypt();

    progress(
      `Call addCountries(3) Contract=${contractAddress} handle=${ethers.hexlify(encryptedThree.handles[0])} signer=${signers.alice.address}...`,
    );
    let tx = await contract
      .connect(signers.alice)
      .addCountries(encryptedThree.handles[0], encryptedThree.inputProof);
    await tx.wait();

    progress(`Call getEncryptedCountryCount()...`);
    const encryptedCount = await contract.getEncryptedCountryCount(signers.alice.address);
    expect(encryptedCount).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting getEncryptedCountryCount()=${encryptedCount}...`);
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      contractAddress,
      signers.alice,
    );
    progress(`Clear getEncryptedCountryCount()=${clearCount}`);
    expect(clearCount).to.eq(3);

    progress(`Encrypting '2' more countries...`);
    const encryptedTwo = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(2)
      .encrypt();

    progress(
      `Call addCountries(2) Contract=${contractAddress} handle=${ethers.hexlify(encryptedTwo.handles[0])} signer=${signers.alice.address}...`,
    );
    tx = await contract.connect(signers.alice).addCountries(encryptedTwo.handles[0], encryptedTwo.inputProof);
    await tx.wait();

    progress(`Call getEncryptedCountryCount()...`);
    const encryptedCountAfter = await contract.getEncryptedCountryCount(signers.alice.address);

    progress(`Decrypting getEncryptedCountryCount()=${encryptedCountAfter}...`);
    const clearCountAfter = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCountAfter,
      contractAddress,
      signers.alice,
    );
    progress(`Clear getEncryptedCountryCount()=${clearCountAfter}`);
    expect(clearCountAfter).to.eq(5); // 3 + 2 = 5
  });
});

