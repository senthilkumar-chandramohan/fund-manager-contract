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
const _minimumBalance = BigInt(1000000);
const _releaseInterval = BigInt(30 * 24 * 60 * 60); // 30 days in seconds
const _fundMaturityDate = BigInt(1768003200);
const _causeName = "Test Fund";
const _causeDescription = "This is a contract to test FundManager template";
const _emergencyWithdrawalAllowed = true;

const FundManagerModule = buildModule("FundManagerModule", (m) => {
  const beneficiaryAddresses = m.getParameter("_beneficiaryAddresses", _beneficiaryAddresses);
  const sharePercentages = m.getParameter("_sharePercentages", _sharePercentages);
  const pyusdTokenAddress = m.getParameter("_pyusdTokenAddress", _pyusdTokenAddress);
  const baseReleaseAmount = m.getParameter("_baseReleaseAmount", _baseReleaseAmount);
  const minimumBalance = m.getParameter("_minimumBalance", _minimumBalance);
  const releaseInterval = m.getParameter("_releaseInterval", _releaseInterval);
  const fundMaturityDate = m.getParameter("_fundMaturityDate", _fundMaturityDate);
  const causeName = m.getParameter("_causeName", _causeName);
  const causeDescription = m.getParameter("_causeDescription", _causeDescription);
  const emergencyWithdrawalAllowed = m.getParameter("_emergencyWithdrawalAllowed", _emergencyWithdrawalAllowed);

  const fundManager = m.contract("FundManager", [
      beneficiaryAddresses,
      sharePercentages,
      pyusdTokenAddress,
      baseReleaseAmount,
      releaseInterval,
      minimumBalance,
      fundMaturityDate,
      causeName,
      causeDescription,
      emergencyWithdrawalAllowed
    ], {
    value: 0n,
  });

  return { fundManager };
});

export default FundManagerModule;
