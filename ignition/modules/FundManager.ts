// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://v2.hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const _beneficiaryAddresses = [
  "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
  "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
];

const _sharePercentages = [
  BigInt(5000), // 50%
  BigInt(3000), // 30%
  BigInt(2000)  // 20%
];

const _pyusdTokenAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";

const _baseReleaseAmount = BigInt(1000000);
const _releaseInterval = BigInt(30 * 24 * 60 * 60); // 30 days in seconds
const _fundMaturityDate = BigInt(1768003200);
const _causeName = "Test Fund";
const _causeDescription = "This is a contract to test FundManager template";

// Multi-sig governance parameters
const _governors = [
  "0x1234567890123456789012345678901234567890", // Replace with actual governor addresses
  "0x0987654321098765432109876543210987654321",
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
];

const _requiredNumberofApprovalsForWithdrawal = BigInt(2);
const _timesEmergencyWithdrawalAllowed = BigInt(5);
const _limitPerEmergencyWithdrawal = BigInt(1000000000); // 1000 PYUSD (with 6 decimals)
const _totalLimitForEmergencyWithdrawal = BigInt(5000000000); // 5000 PYUSD (with 6 decimals)

const FundManagerModule = buildModule("FundManagerModule", (m) => {
  const beneficiaryAddresses = m.getParameter("_beneficiaryAddresses", _beneficiaryAddresses);
  const sharePercentages = m.getParameter("_sharePercentages", _sharePercentages);
  const pyusdTokenAddress = m.getParameter("_pyusdTokenAddress", _pyusdTokenAddress);
  const baseReleaseAmount = m.getParameter("_baseReleaseAmount", _baseReleaseAmount);
  const releaseInterval = m.getParameter("_releaseInterval", _releaseInterval);
  const fundMaturityDate = m.getParameter("_fundMaturityDate", _fundMaturityDate);
  const causeName = m.getParameter("_causeName", _causeName);
  const causeDescription = m.getParameter("_causeDescription", _causeDescription);
  const governors = m.getParameter("_governors", _governors);
  const requiredNumberofApprovalsForWithdrawal = m.getParameter("_requiredNumberofApprovalsForWithdrawal", _requiredNumberofApprovalsForWithdrawal);
  const timesEmergencyWithdrawalAllowed = m.getParameter("_timesEmergencyWithdrawalAllowed", _timesEmergencyWithdrawalAllowed);
  const limitPerEmergencyWithdrawal = m.getParameter("_limitPerEmergencyWithdrawal", _limitPerEmergencyWithdrawal);
  const totalLimitForEmergencyWithdrawal = m.getParameter("_totalLimitForEmergencyWithdrawal", _totalLimitForEmergencyWithdrawal);

  const fundManager = m.contract("FundManager", [
      beneficiaryAddresses,
      sharePercentages,
      pyusdTokenAddress,
      baseReleaseAmount,
      releaseInterval,
      fundMaturityDate,
      causeName,
      causeDescription,
      governors,
      requiredNumberofApprovalsForWithdrawal,
      timesEmergencyWithdrawalAllowed,
      limitPerEmergencyWithdrawal,
      totalLimitForEmergencyWithdrawal
    ], {
    value: 0n,
  });

  return { fundManager };
});

export default FundManagerModule;
