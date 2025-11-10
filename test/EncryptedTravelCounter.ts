import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedTravelCounter, EncryptedTravelCounter__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedTravelCounter")) as EncryptedTravelCounter__factory;
  const contract = (await factory.deploy()) as EncryptedTravelCounter;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("EncryptedTravelCounter", function () {
  let signers: Signers;
  let contract: EncryptedTravelCounter;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("should return false for hasInitialized before first use", async function () {
    expect(await contract.hasInitialized(signers.alice.address)).to.be.false;
  });

  it("should initialize and add countries for first time", async function () {
    const countryCount = 5;
    const encryptedCount = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(countryCount)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .addCountries(encryptedCount.handles[0], encryptedCount.inputProof);
    await tx.wait();

    expect(await contract.hasInitialized(signers.alice.address)).to.be.true;

    const encryptedResult = await contract.getEncryptedCountryCount(signers.alice.address);
    const decryptedResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedResult,
      contractAddress,
      signers.alice,
    );

    expect(decryptedResult).to.eq(countryCount);
  });

  it("should accumulate countries when adding multiple times", async function () {
    // First addition: 3 countries
    const firstCount = 3;
    const encryptedFirst = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(firstCount)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .addCountries(encryptedFirst.handles[0], encryptedFirst.inputProof);
    await tx.wait();

    // Second addition: 2 countries
    const secondCount = 2;
    const encryptedSecond = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(secondCount)
      .encrypt();

    tx = await contract
      .connect(signers.alice)
      .addCountries(encryptedSecond.handles[0], encryptedSecond.inputProof);
    await tx.wait();

    // Verify total
    const encryptedResult = await contract.getEncryptedCountryCount(signers.alice.address);
    const decryptedResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedResult,
      contractAddress,
      signers.alice,
    );

    expect(decryptedResult).to.eq(firstCount + secondCount); // 3 + 2 = 5
  });

  it("should keep separate counts for different users", async function () {
    // Alice adds 5 countries
    const aliceCount = 5;
    const encryptedAlice = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceCount)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .addCountries(encryptedAlice.handles[0], encryptedAlice.inputProof);
    await tx.wait();

    // Bob adds 7 countries
    const bobCount = 7;
    const encryptedBob = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(bobCount)
      .encrypt();

    tx = await contract
      .connect(signers.bob)
      .addCountries(encryptedBob.handles[0], encryptedBob.inputProof);
    await tx.wait();

    // Verify Alice's count
    const encryptedAliceResult = await contract.getEncryptedCountryCount(signers.alice.address);
    const decryptedAliceResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedAliceResult,
      contractAddress,
      signers.alice,
    );
    expect(decryptedAliceResult).to.eq(aliceCount);

    // Verify Bob's count
    const encryptedBobResult = await contract.getEncryptedCountryCount(signers.bob.address);
    const decryptedBobResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedBobResult,
      contractAddress,
      signers.bob,
    );
    expect(decryptedBobResult).to.eq(bobCount);
  });
});

