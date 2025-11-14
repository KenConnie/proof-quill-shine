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
    const deployment = await deployFixture();
    contract = deployment.contract;
    contractAddress = deployment.contractAddress;
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

  describe("Access Control", function () {
    it("Should only allow users to modify their own counters", async function () {
      const aliceCount = 5;
      const bobCount = 3;

      // Alice adds countries
      const aliceInput = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
      aliceInput.add32(aliceCount);
      const aliceEncrypted = aliceInput.encrypt();
      await contract.connect(signers.alice).addCountries(aliceEncrypted.handles[0], aliceEncrypted.inputProof);

      // Bob adds countries
      const bobInput = fhevm.createEncryptedInput(contractAddress, signers.bob.address);
      bobInput.add32(bobCount);
      const bobEncrypted = bobInput.encrypt();
      await contract.connect(signers.bob).addCountries(bobEncrypted.handles[0], bobEncrypted.inputProof);

      // Verify Alice's count
      const aliceEncryptedResult = await contract.getEncryptedCountryCount(signers.alice.address);
      const aliceDecrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        aliceEncryptedResult,
        contractAddress,
        signers.alice,
      );
      expect(aliceDecrypted).to.eq(aliceCount);

      // Verify Bob's count (should be separate)
      const bobEncryptedResult = await contract.getEncryptedCountryCount(signers.bob.address);
      const bobDecrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        bobEncryptedResult,
        contractAddress,
        signers.bob,
      );
      expect(bobDecrypted).to.eq(bobCount);
    });

    it("Should properly initialize new users", async function () {
      // Check initial state
      expect(await contract.hasInitialized(signers.alice.address)).to.be.false;

      // Add countries
      const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
      input.add32(10);
      const encrypted = input.encrypt();
      await contract.connect(signers.alice).addCountries(encrypted.handles[0], encrypted.inputProof);

      // Check initialized state
      expect(await contract.hasInitialized(signers.alice.address)).to.be.true;
    });
  });

  describe("Event Emission", function () {
    it("Should emit CountryCountAdded event with correct parameters", async function () {
      const count = 7;
      const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
      input.add32(count);
      const encrypted = input.encrypt();

      await expect(
        contract.connect(signers.alice).addCountries(encrypted.handles[0], encrypted.inputProof)
      )
        .to.emit(contract, "CountryCountAdded")
        .withArgs(signers.alice.address); // Note: timestamp is also emitted but we check the address
    });

    it("Should emit event with indexed user parameter", async function () {
      const count = 3;
      const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
      input.add32(count);
      const encrypted = input.encrypt();

      const tx = await contract.connect(signers.alice).addCountries(encrypted.handles[0], encrypted.inputProof);
      const receipt = await tx.wait();

      // Check that the event was emitted with indexed user
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log)?.name === "CountryCountAdded";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const parsedEvent = contract.interface.parseLog(event!);
      expect(parsedEvent.args.user).to.eq(signers.alice.address);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero country count gracefully", async function () {
      // Note: Frontend validation prevents this, but contract should handle it
      const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
      input.add32(0); // Zero count
      const encrypted = input.encrypt();

      // This should work (though frontend prevents it)
      await expect(
        contract.connect(signers.alice).addCountries(encrypted.handles[0], encrypted.inputProof)
      ).to.not.be.reverted;
    });

    it("Should handle large country counts", async function () {
      const largeCount = 150; // Large but valid count
      const input = fhevm.createEncryptedInput(contractAddress, signers.alice.address);
      input.add32(largeCount);
      const encrypted = input.encrypt();

      await expect(
        contract.connect(signers.alice).addCountries(encrypted.handles[0], encrypted.inputProof)
      ).to.not.be.reverted;

      // Verify the count was stored
      const encryptedResult = await contract.getEncryptedCountryCount(signers.alice.address);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedResult,
        contractAddress,
        signers.alice,
      );
      expect(decrypted).to.eq(largeCount);
    });
  });
});

