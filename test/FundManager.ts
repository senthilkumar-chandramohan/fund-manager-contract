import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("FundManager", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  const sampleContractParams = {
    beneficiaryAddresses: [
      "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
      "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
      "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
    ],
    sharePercentages: [
      BigInt(5000), // 50%
      BigInt(3000), // 30%
      BigInt(2000)  // 20%
    ],
    pyusdTokenAddress: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
    baseReleaseAmount: BigInt(1000000),
    releaseInterval: BigInt(30 * 24 * 60 * 60), // 30 days in seconds
    minimumBalance: BigInt(1000000),
    fundMaturityDate: BigInt(2798333200),
    causeName: "Test Fund",
    causeDescription: "This is a contract to test FundManager template",
    emergencyWithdrawalAllowed: true,
  };

  async function deployFundManagerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // Deploy a mock ERC20 token for testing
    const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
    const mockToken = await ERC20Mock.deploy("Mock PYUSD", "PYUSD", 6);
    await mockToken.waitForDeployment();

    // Mint tokens to owner and otherAccount for testing
    const tokenAmount = hre.ethers.parseUnits("10000", 6); // 10,000 PYUSD
    await (mockToken as any).mint(owner.address, tokenAmount);
    await (mockToken as any).mint(otherAccount.address, tokenAmount);

    const {
      beneficiaryAddresses,
      sharePercentages,
      baseReleaseAmount,
      releaseInterval,
      minimumBalance,
      fundMaturityDate,
      causeName,
      causeDescription,
      emergencyWithdrawalAllowed
    } = sampleContractParams;

    const FundManager = await hre.ethers.getContractFactory("FundManager");
    const fundManager = await FundManager.deploy(
      beneficiaryAddresses,
      sharePercentages,
      await mockToken.getAddress(), // Use mock token address
      baseReleaseAmount,
      releaseInterval,
      minimumBalance,
      fundMaturityDate,
      causeName,
      causeDescription,
      emergencyWithdrawalAllowed
    );
    
    return { fundManager, mockToken, owner, otherAccount }; 
  }

  describe("Deployment", function () {
    it("Should set the right number of beneficiaries", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);

      const beneficiaryCount = await fundManager.getBeneficiaryCount();
      expect(beneficiaryCount).to.equal(sampleContractParams.beneficiaryAddresses.length);
    });

    it("Should set the right cause name", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);

      const causeName = await fundManager.causeName();
      expect(causeName).to.equal(sampleContractParams.causeName);
    });

    it("Should set the right emergency withdrawal flag", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);

      const emergencyWithdrawalAllowed = await fundManager.emergencyWithdrawalAllowed();
      expect(emergencyWithdrawalAllowed).to.equal(sampleContractParams.emergencyWithdrawalAllowed);
    });

    it("Should set the right share percentages", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);

      const beneficiaryCount = await fundManager.getBeneficiaryCount();

      for (var i=0; i<beneficiaryCount; i++) {
        const beneficiary = await fundManager.beneficiaries(i);
        expect(beneficiary.sharePercentage).to.equal(sampleContractParams.sharePercentages[i]);
      }      
    });

    it("Should fail if the fundMaturityDate is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const FundManager = await hre.ethers.getContractFactory("FundManager");
      const {
        beneficiaryAddresses,
        sharePercentages,
        pyusdTokenAddress,
        baseReleaseAmount,
        releaseInterval,
        minimumBalance,
        causeName,
        causeDescription,
        emergencyWithdrawalAllowed
      } = sampleContractParams;
      
      await expect(FundManager.deploy(
        beneficiaryAddresses,
        sharePercentages,
        pyusdTokenAddress,
        baseReleaseAmount,
        releaseInterval,
        minimumBalance,
        BigInt(await time.latest()),
        causeName,
        causeDescription,
        emergencyWithdrawalAllowed)).to.be.revertedWithCustomError(
          FundManager,
          "InvalidMaturityDate"
        );
    });

    it("Should fail if the # of beneficiaries and # of shares don't match", async function () {
      // We don't use the fixture here because we want a different deployment
      const FundManager = await hre.ethers.getContractFactory("FundManager");
      const {
        beneficiaryAddresses,
        pyusdTokenAddress,
        baseReleaseAmount,
        releaseInterval,
        minimumBalance,
        fundMaturityDate,
        causeName,
        causeDescription,
        emergencyWithdrawalAllowed
      } = sampleContractParams;

      await expect(FundManager.deploy(
        beneficiaryAddresses,
        [
          BigInt(5000), // 50%
          BigInt(3000), // 30%
        ],
        pyusdTokenAddress,
        baseReleaseAmount,
        releaseInterval,
        minimumBalance,
        fundMaturityDate,
        causeName,
        causeDescription,
        emergencyWithdrawalAllowed)).to.be.revertedWithCustomError(
          FundManager,
          "InvalidBeneficiaryShares"
        );
    });

    it("Should fail if the total share percentage is not 100", async function () {
      const {
        beneficiaryAddresses,
        pyusdTokenAddress,
        baseReleaseAmount,
        releaseInterval,
        minimumBalance,
        fundMaturityDate,
        causeName,
        causeDescription,
        emergencyWithdrawalAllowed
      } = sampleContractParams;

      // We don't use the fixture here because we want a different deployment
      const FundManager = await hre.ethers.getContractFactory("FundManager");
      await expect(FundManager.deploy(
        beneficiaryAddresses,
        [
          BigInt(5000), // 50%
          BigInt(3000), // 30%
          BigInt(1000), // 10%
        ],
        pyusdTokenAddress,
        baseReleaseAmount,
        releaseInterval,
        minimumBalance,
        fundMaturityDate,
        causeName,
        causeDescription,
        emergencyWithdrawalAllowed)).to.be.revertedWithCustomError(
          FundManager,
          "InvalidTotalSharePercentage"
        );
    });
  });

  describe("Events & Transfers", function () {
    it("Should emit an event on receiving funds and have amount in wallet", async function () {
      const { fundManager, mockToken, owner } = await loadFixture(
        deployFundManagerFixture
      );

      const sendAmount = hre.ethers.parseUnits("1000", 6); // 1000 PYUSD

      // Approve FundManager to spend tokens
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), sendAmount);

      // Now call receiveFund
      await expect(fundManager.connect(owner).receiveFund(sendAmount, "Test note"))
        .to.emit(fundManager, "FundReceived");
      
      const walletBalance = await fundManager.getWalletBalance();
      expect(walletBalance).to.equals(BigInt(sendAmount));
    });

    it("Should emit an event on emergency withdrawals and purge balance", async function () {
      const { fundManager } = await loadFixture(
        deployFundManagerFixture
      );

      await expect(fundManager.executeEmergencyWithdrawal())
        .to.emit(fundManager, "EmergencyWithdrawalExecuted");
        //.withArgs(lockedAmount, anyValue); // We accept any value as `when` arg

      const walletBalance = await fundManager.getWalletBalance();
      expect(walletBalance).to.equals(BigInt(0));
    });
  });
});
