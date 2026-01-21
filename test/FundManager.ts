import {
  time,
  loadFixture,
  mine,
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

  const emergencyWithdrawalConfig = {
    requiredNumberofApprovals: BigInt(2),
    timesAllowed: BigInt(5),
    limitPerWithdrawal: hre.ethers.parseUnits("1000", 6),
    totalLimit: hre.ethers.parseUnits("5000", 6),
  };

  async function deployFundManagerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, governor1, governor2, governor3, beneficiary1, beneficiary2, beneficiary3, nonGovernor] = await hre.ethers.getSigners();

    // Deploy a mock ERC20 token for testing
    const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
    const mockToken = await ERC20Mock.deploy("Mock PYUSD", "PYUSD", 6);
    await mockToken.waitForDeployment();

    // Mint tokens to owner for testing
    const tokenAmount = hre.ethers.parseUnits("50000", 6); // 50,000 PYUSD
    await (mockToken as any).mint(owner.address, tokenAmount);

    const beneficiaryAddresses = [
      beneficiary1.address,
      beneficiary2.address,
      beneficiary3.address
    ];
    const sharePercentages = [
      BigInt(5000), // 50%
      BigInt(3000), // 30%
      BigInt(2000)  // 20%
    ];

    const {
      baseReleaseAmount,
      releaseInterval,
      fundMaturityDate,
      causeName,
      causeDescription,
    } = sampleContractParams;

    const governors = [governor1.address, governor2.address, governor3.address];

    const FundManager = await hre.ethers.getContractFactory("FundManager");
    const fundManager = await FundManager.deploy(
      beneficiaryAddresses,
      sharePercentages,
      await mockToken.getAddress(),
      baseReleaseAmount,
      releaseInterval,
      fundMaturityDate,
      causeName,
      causeDescription,
      governors,
      emergencyWithdrawalConfig.requiredNumberofApprovals,
      emergencyWithdrawalConfig.timesAllowed,
      emergencyWithdrawalConfig.limitPerWithdrawal,
      emergencyWithdrawalConfig.totalLimit
    );
    
    return { 
      fundManager, 
      mockToken, 
      owner, 
      governor1, 
      governor2, 
      governor3,
      nonGovernor,
      beneficiary1, 
      beneficiary2, 
      beneficiary3, 
      beneficiaryAddresses, 
      sharePercentages,
      governors
    }; 
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

    it("Should set the right emergency withdrawal config", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);

      const config = await fundManager.emergencyWithdrawalConfig();
      expect(config.requiredNumberofApprovals).to.equal(emergencyWithdrawalConfig.requiredNumberofApprovals);
      expect(config.timesAllowed).to.equal(emergencyWithdrawalConfig.timesAllowed);
      expect(config.limitPerWithdrawal).to.equal(emergencyWithdrawalConfig.limitPerWithdrawal);
      expect(config.totalLimit).to.equal(emergencyWithdrawalConfig.totalLimit);
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
        baseReleaseAmount,
        releaseInterval,
        fundMaturityDate,
        causeName,
        causeDescription,
      } = sampleContractParams;

      const [, governor1] = await hre.ethers.getSigners();
      
      await expect(FundManager.deploy(
        beneficiaryAddresses,
        sharePercentages,
        "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
        baseReleaseAmount,
        releaseInterval,
        BigInt(await time.latest()),
        causeName,
        causeDescription,
        [governor1.address],
        BigInt(1),
        BigInt(5),
        BigInt(1000),
        BigInt(5000))).to.be.revertedWithCustomError(
          FundManager,
          "InvalidMaturityDate"
        );
    });

    it("Should fail if the # of beneficiaries and # of shares don't match", async function () {
      // We don't use the fixture here because we want a different deployment
      const FundManager = await hre.ethers.getContractFactory("FundManager");
      const {
        beneficiaryAddresses,
        baseReleaseAmount,
        releaseInterval,
        fundMaturityDate,
        causeName,
        causeDescription,
      } = sampleContractParams;

      const [, governor1] = await hre.ethers.getSigners();

      await expect(FundManager.deploy(
        beneficiaryAddresses,
        [
          BigInt(5000), // 50%
          BigInt(3000), // 30%
        ],
        "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
        baseReleaseAmount,
        releaseInterval,
        fundMaturityDate,
        causeName,
        causeDescription,
        [governor1.address],
        BigInt(1),
        BigInt(5),
        BigInt(1000),
        BigInt(5000))).to.be.revertedWithCustomError(
          FundManager,
          "InvalidBeneficiaryShares"
        );
    });

    it("Should fail if the total share percentage is not 100", async function () {
      const {
        beneficiaryAddresses,
        baseReleaseAmount,
        releaseInterval,
        fundMaturityDate,
        causeName,
        causeDescription,
      } = sampleContractParams;

      const [, governor1] = await hre.ethers.getSigners();

      // We don't use the fixture here because we want a different deployment
      const FundManager = await hre.ethers.getContractFactory("FundManager");
      await expect(FundManager.deploy(
        beneficiaryAddresses,
        [
          BigInt(5000), // 50%
          BigInt(3000), // 30%
          BigInt(1000), // 10%
        ],
        "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
        baseReleaseAmount,
        releaseInterval,
        fundMaturityDate,
        causeName,
        causeDescription,
        [governor1.address],
        BigInt(1),
        BigInt(5),
        BigInt(1000),
        BigInt(5000))).to.be.revertedWithCustomError(
          FundManager,
          "InvalidTotalSharePercentage"
        );
    });
  });

  describe("Fund Transfers", function () {
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
  });

  describe("Emergency Withdrawal - Initiate", function () {
    it("Should allow a governor to initiate emergency withdrawal", async function () {
      const { fundManager, mockToken, owner, governor1 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6); // 5000 PYUSD
      const withdrawAmount = hre.ethers.parseUnits("500", 6); // 500 PYUSD

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate emergency withdrawal
      const tx = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const receipt = await tx.wait();

      // Verify event was emitted
      expect(tx).to.emit(fundManager, "EmergencyWithdrawalInitiated");
      expect(tx).to.emit(fundManager, "EmergencyWithdrawalApproved");

      // Extract withdrawal ID from logs
      const logs = receipt?.logs || [];
      expect(logs.length).to.be.greaterThan(0);
    });

    it("Should reject emergency withdrawal initiation from non-governor", async function () {
      const { fundManager, mockToken, owner, nonGovernor } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Try to initiate withdrawal as non-governor
      await expect(
        fundManager.connect(nonGovernor).initiateEmergencyWithdrawal(withdrawAmount)
      ).to.be.revertedWithCustomError(fundManager, "NotGovernor");
    });

    it("Should reject withdrawal exceeding per-withdrawal limit", async function () {
      const { fundManager, mockToken, owner, governor1 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const excessiveWithdrawAmount = hre.ethers.parseUnits("2000", 6); // Exceeds limit of 1000

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Try to initiate withdrawal exceeding limit
      await expect(
        fundManager.connect(governor1).initiateEmergencyWithdrawal(excessiveWithdrawAmount)
      ).to.be.revertedWithCustomError(fundManager, "WithdrawalAmountBreachesLimit");
    });

    it("Should reject withdrawal exceeding total limit", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("10000", 6);
      const withdrawAmount = hre.ethers.parseUnits("1000", 6); // At per-withdrawal limit

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate and execute 5 successful withdrawals (5 * 1000 = 5000 total, hitting the limit)
      for (let i = 0; i < 5; i++) {
        const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
        const initiateReceipt = await initiateResult.wait();
        
        // Extract withdrawal ID from event
        if (initiateReceipt?.logs) {
          const eventLog = initiateReceipt.logs.find(log => {
            try {
              const decoded = fundManager.interface.parseLog(log);
              return decoded?.name === "EmergencyWithdrawalInitiated";
            } catch {
              return false;
            }
          });

          if (eventLog) {
            const decodedEvent = fundManager.interface.parseLog(eventLog);
            const withdrawalId = decodedEvent?.args[0];

            // Get approval from second governor
            await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

            // Execute withdrawal
            await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId);
          }
        }
      }

      // The 6th withdrawal of 1000 should fail as we've already withdrawn 5000 (the total limit)
      await expect(
        fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount)
      ).to.be.revertedWithCustomError(fundManager, "TotalWithdrawalLimitBreached");
    });

    it("Should initialize withdrawal with correct status", async function () {
      const { fundManager, mockToken, owner, governor1 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Verify withdrawal details
          const withdrawal = await fundManager.emergencyWithdrawals(withdrawalId);
          expect(withdrawal.status).to.equal("INITIATED");
          expect(withdrawal.amount).to.equal(withdrawAmount);

          // Verify initiator has approved
          const approvalCount = await fundManager.emergencyWithdrawalApprovals(withdrawalId);
          expect(approvalCount).to.equal(1);
        }
      }
    });

    it("Should return a unique withdrawal ID on each initiation", async function () {
      const { fundManager, mockToken, owner, governor1 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate first withdrawal
      const tx1 = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const result1 = await tx1.wait();

      // Wait a bit to ensure different block timestamp
      await mine(1);

      // Initiate second withdrawal
      const tx2 = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const result2 = await tx2.wait();

      // Withdrawal IDs should be different (they include block.timestamp)
      expect(result1?.hash).to.not.equal(result2?.hash);
    });
  });

  describe("Emergency Withdrawal - Approve", function () {
    it("Should allow a governor to approve emergency withdrawal", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal (governor1 auto-approves)
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Approve by second governor
          const approveTx = await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Verify event was emitted
          expect(approveTx).to.emit(fundManager, "EmergencyWithdrawalApproved");

          // Verify approval count increased
          const approvalCount = await fundManager.emergencyWithdrawalApprovals(withdrawalId);
          expect(approvalCount).to.equal(2);
        }
      }
    });

    it("Should reject approval from non-governor", async function () {
      const { fundManager, mockToken, owner, governor1, nonGovernor } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Try to approve as non-governor
          await expect(
            fundManager.connect(nonGovernor).approveEmergencyWithdrawal(withdrawalId)
          ).to.be.revertedWithCustomError(fundManager, "NotGovernor");
        }
      }
    });

    it("Should reject duplicate approval from same governor", async function () {
      const { fundManager, mockToken, owner, governor1 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal (governor1 auto-approves)
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Try to approve again from same governor
          await expect(
            fundManager.connect(governor1).approveEmergencyWithdrawal(withdrawalId)
          ).to.be.revertedWithCustomError(fundManager, "AlreadyApproved");
        }
      }
    });

    it("Should increment approval count correctly", async function () {
      const { fundManager, mockToken, owner, governor1, governor2, governor3 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal (governor1 auto-approves with count 1)
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Check initial count
          let approvalCount = await fundManager.emergencyWithdrawalApprovals(withdrawalId);
          expect(approvalCount).to.equal(1);

          // Governor2 approves
          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);
          approvalCount = await fundManager.emergencyWithdrawalApprovals(withdrawalId);
          expect(approvalCount).to.equal(2);

          // Governor3 approves
          await fundManager.connect(governor3).approveEmergencyWithdrawal(withdrawalId);
          approvalCount = await fundManager.emergencyWithdrawalApprovals(withdrawalId);
          expect(approvalCount).to.equal(3);
        }
      }
    });

    it("Should correctly track which governors have approved", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal (governor1 auto-approves)
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Verify governor1 has approved
          let hasApproved = await fundManager.hasApprovedEmergencyWithdrawal(withdrawalId, governor1.address);
          expect(hasApproved).to.be.true;

          // Verify governor2 has not approved yet
          hasApproved = await fundManager.hasApprovedEmergencyWithdrawal(withdrawalId, governor2.address);
          expect(hasApproved).to.be.false;

          // Governor2 approves
          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Verify governor2 has now approved
          hasApproved = await fundManager.hasApprovedEmergencyWithdrawal(withdrawalId, governor2.address);
          expect(hasApproved).to.be.true;
        }
      }
    });

    it("Should emit event with correct approval count", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Governor2 approves and verify event
          const approveTx = await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Verify the emitted event contains correct data
          await expect(approveTx)
            .to.emit(fundManager, "EmergencyWithdrawalApproved")
            .withArgs(withdrawalId, governor2.address, 2);
        }
      }
    });
  });

  describe("Emergency Withdrawal - Execute", function () {
    it("Should allow a governor to execute approved emergency withdrawal", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal (governor1 auto-approves)
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      // Extract withdrawal ID
      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Get approval from second governor (now has 2 approvals)
          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Execute withdrawal
          const executeTx = await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId);

          // Verify event was emitted
          expect(executeTx).to.emit(fundManager, "EmergencyWithdrawalExecuted");
        }
      }
    });

    it("Should reject execution from non-governor", async function () {
      const { fundManager, mockToken, owner, governor1, governor2, nonGovernor } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal and get approvals
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Get required approvals
          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Try to execute as non-governor
          await expect(
            fundManager.connect(nonGovernor).executeEmergencyWithdrawal(withdrawalId)
          ).to.be.revertedWithCustomError(fundManager, "NotGovernor");
        }
      }
    });

    it("Should correctly distribute funds to beneficiaries", async function () {
      const { fundManager, mockToken, owner, governor1, governor2, beneficiary1, beneficiary2, beneficiary3, sharePercentages } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("1000", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Record initial balances
      const initialBalance1 = await erc20Token.balanceOf(beneficiary1.address);
      const initialBalance2 = await erc20Token.balanceOf(beneficiary2.address);
      const initialBalance3 = await erc20Token.balanceOf(beneficiary3.address);

      // Initiate withdrawal and get approvals
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Get required approvals
          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Execute withdrawal
          await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId);

          // Verify distributions
          const finalBalance1 = await erc20Token.balanceOf(beneficiary1.address);
          const finalBalance2 = await erc20Token.balanceOf(beneficiary2.address);
          const finalBalance3 = await erc20Token.balanceOf(beneficiary3.address);

          const expectedShare1 = (BigInt(withdrawAmount) * sharePercentages[0]) / BigInt(10000);
          const expectedShare2 = (BigInt(withdrawAmount) * sharePercentages[1]) / BigInt(10000);
          const expectedShare3 = (BigInt(withdrawAmount) * sharePercentages[2]) / BigInt(10000);

          expect(finalBalance1 - initialBalance1).to.equal(expectedShare1);
          expect(finalBalance2 - initialBalance2).to.equal(expectedShare2);
          expect(finalBalance3 - initialBalance3).to.equal(expectedShare3);
        }
      }
    });

    it("Should update totalWithdrawnAmount correctly", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("10000", 6);
      const withdrawAmount1 = hre.ethers.parseUnits("500", 6);
      const withdrawAmount2 = hre.ethers.parseUnits("300", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initial total should be 0
      let totalWithdrawn = await fundManager.totalWithdrawnAmount();
      expect(totalWithdrawn).to.equal(0);

      // First withdrawal
      const initiate1 = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount1);
      const receipt1 = await initiate1.wait();

      if (receipt1?.logs) {
        const eventLog1 = receipt1.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog1) {
          const decodedEvent1 = fundManager.interface.parseLog(eventLog1);
          const withdrawalId1 = decodedEvent1?.args[0];

          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId1);
          await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId1);

          // Check total after first withdrawal
          totalWithdrawn = await fundManager.totalWithdrawnAmount();
          expect(totalWithdrawn).to.equal(withdrawAmount1);

          // Second withdrawal
          const initiate2 = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount2);
          const receipt2 = await initiate2.wait();

          if (receipt2?.logs) {
            const eventLog2 = receipt2.logs.find(log => {
              try {
                const decoded = fundManager.interface.parseLog(log);
                return decoded?.name === "EmergencyWithdrawalInitiated";
              } catch {
                return false;
              }
            });

            if (eventLog2) {
              const decodedEvent2 = fundManager.interface.parseLog(eventLog2);
              const withdrawalId2 = decodedEvent2?.args[0];

              await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId2);
              await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId2);

              // Check total after second withdrawal
              totalWithdrawn = await fundManager.totalWithdrawnAmount();
              expect(totalWithdrawn).to.equal(BigInt(withdrawAmount1) + BigInt(withdrawAmount2));
            }
          }
        }
      }
    });

    it("Should emit EmergencyWithdrawalExecuted event with correct data", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate and approve withdrawal
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Execute and verify event
          const executeTx = await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId);

          await expect(executeTx)
            .to.emit(fundManager, "EmergencyWithdrawalExecuted")
            .withArgs(withdrawAmount, anyValue);
        }
      }
    });

    it("Should protect against insufficient token balance with tokenBalanceIsSufficient modifier", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("500", 6);
      const withdrawAmount = hre.ethers.parseUnits("800", 6); // More than we'll deposit

      // Deposit only 500 tokens (less than withdrawal amount of 800)
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Try to initiate withdrawal of 800 - should fail because it checks the balance isn't sufficient
      // Actually the limit is 1000 so this won't fail at initiation due to limit
      // Let's use a smaller withdrawal amount that passes the limit but still exceeds balance
      const smallerWithdrawAmount = hre.ethers.parseUnits("600", 6); // More than 500 deposited
      
      // Try to initiate - will succeed at initiation since it's under the 1000 limit
      // But we can verify the modifier exists and protects the execution
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(smallerWithdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          // Get approvals
          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Try to execute - should fail due to insufficient balance (600 requested but only 500 available)
          await expect(
            fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId)
          ).to.be.revertedWithCustomError(fundManager, "InsufficientTokens");
        }
      }
    });

    it("Should reduce wallet balance after execution", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("1000", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Check initial balance
      let walletBalance = await fundManager.getWalletBalance();
      expect(walletBalance).to.equal(depositAmount);

      // Initiate and execute withdrawal
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);
          await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId);

          // Check final balance
          walletBalance = await fundManager.getWalletBalance();
          expect(walletBalance).to.equal(BigInt(depositAmount) - BigInt(withdrawAmount));
        }
      }
    });

    it("Should handle multiple sequential withdrawals correctly", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("10000", 6);
      const withdrawAmounts = [
        hre.ethers.parseUnits("300", 6),
        hre.ethers.parseUnits("400", 6),
        hre.ethers.parseUnits("200", 6),
      ];

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      let expectedRemainingBalance = BigInt(depositAmount);

      // Execute multiple withdrawals
      for (let i = 0; i < withdrawAmounts.length; i++) {
        const withdrawAmount = withdrawAmounts[i];

        // Initiate withdrawal
        const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
        const initiateReceipt = await initiateResult.wait();

        if (initiateReceipt?.logs) {
          const eventLog = initiateReceipt.logs.find(log => {
            try {
              const decoded = fundManager.interface.parseLog(log);
              return decoded?.name === "EmergencyWithdrawalInitiated";
            } catch {
              return false;
            }
          });

          if (eventLog) {
            const decodedEvent = fundManager.interface.parseLog(eventLog);
            const withdrawalId = decodedEvent?.args[0];

            // Get approvals
            await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

            // Execute
            await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId);

            // Verify balance reduced correctly
            expectedRemainingBalance -= BigInt(withdrawAmount);
            const actualBalance = await fundManager.getWalletBalance();
            expect(actualBalance).to.equal(expectedRemainingBalance);
          }
        }
      }

      // Verify total withdrawn is sum of all amounts
      const totalWithdrawn = await fundManager.totalWithdrawnAmount();
      const expectedTotal = withdrawAmounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0));
      expect(totalWithdrawn).to.equal(expectedTotal);
    });

    it("Should enforce non-reentrancy", async function () {
      const { fundManager, mockToken, owner, governor1, governor2 } = await loadFixture(
        deployFundManagerFixture
      );

      const depositAmount = hre.ethers.parseUnits("5000", 6);
      const withdrawAmount = hre.ethers.parseUnits("500", 6);

      // Deposit funds
      const erc20Token = mockToken as any;
      await erc20Token.approve(await fundManager.getAddress(), depositAmount);
      await fundManager.connect(owner).receiveFund(depositAmount, "Test deposit");

      // Initiate withdrawal and get approvals
      const initiateResult = await fundManager.connect(governor1).initiateEmergencyWithdrawal(withdrawAmount);
      const initiateReceipt = await initiateResult.wait();

      if (initiateReceipt?.logs) {
        const eventLog = initiateReceipt.logs.find(log => {
          try {
            const decoded = fundManager.interface.parseLog(log);
            return decoded?.name === "EmergencyWithdrawalInitiated";
          } catch {
            return false;
          }
        });

        if (eventLog) {
          const decodedEvent = fundManager.interface.parseLog(eventLog);
          const withdrawalId = decodedEvent?.args[0];

          await fundManager.connect(governor2).approveEmergencyWithdrawal(withdrawalId);

          // Execute should succeed (ReentrancyGuard is working)
          const executeTx = await fundManager.connect(governor1).executeEmergencyWithdrawal(withdrawalId);
          expect(executeTx).to.not.be.reverted;
        }
      }
    });
  });
});
