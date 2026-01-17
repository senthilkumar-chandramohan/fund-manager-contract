// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract FundManager is Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Beneficiary {
        address payable wallet;
        uint256 sharePercentage; // In basis points (10000 = 100%)
    }

    // Beneficiary config
    Beneficiary[] public beneficiaries;

    // Token address
    IERC20 public immutable pyusdToken;

    // Fund release parameters
    uint256 public baseReleaseAmount; // In fiat currency with 6 decimals (e.g., 1234000000 = $1234)
    uint256 public immutable releaseInterval; // In seconds (default 30 days)
    uint256 public lastReleaseTime;
    uint256 public lastReleaseAmount;
    uint256 public immutable minimumBalance;
    uint256 public immutable fundMaturityDate; // epoch time of fund's maturity date after which payout is allowed.

    // Emergency withdrawal config
    bool public immutable emergencyWithdrawalAllowed;
    bool public isEmergencyWithdrawn;
    
    // Set cause metadata
    string public causeName;
    string public causeDescription;

    event FundReceived(
        address indexed sender,
        string indexed note,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event EmergencyWithdrawalExecuted(
        uint256 totalAmount,
        uint256 timestamp
    );

    // Errors
    error InvalidMaturityDate();
    error InvalidBeneficiaryShares();
    error InvalidTotalSharePercentage();
    error ZeroAmount();

    constructor (
        address[] memory _beneficiaryAddresses,
        uint256[] memory _sharePercentages,
        address _pyusdTokenAddress,
        uint256 _baseReleaseAmount,
        uint256 _releaseInterval,
        uint256 _minimumBalance,
        uint256 _fundMaturityDate,
        string memory _causeName,
        string memory _causeDescription,
        bool _emergencyWithdrawalAllowed
    ) {

        if (block.timestamp >= _fundMaturityDate) {
            revert InvalidMaturityDate();
        }

        if (
            _beneficiaryAddresses.length == 0 ||
            _beneficiaryAddresses.length != _sharePercentages.length
        ) {
            revert InvalidBeneficiaryShares();
        }

        uint256 _totalShares = 0;
        for (uint256 i = 0; i < _beneficiaryAddresses.length; i++) {
            beneficiaries.push(
                Beneficiary({
                    wallet: payable(_beneficiaryAddresses[i]),
                    sharePercentage: _sharePercentages[i]
                })
            );

            _totalShares += _sharePercentages[i];
        }

        // Ensure share totals to 100%
        if (_totalShares != 10000) revert InvalidTotalSharePercentage();

        // Set token address
        pyusdToken = IERC20(_pyusdTokenAddress);

        // Set fund release parameters
        baseReleaseAmount = _baseReleaseAmount; // In fiat currency with 6 decimals (e.g., 1234000000 = $1234)
        releaseInterval = _releaseInterval; // In seconds (default 30 days)
        minimumBalance = _minimumBalance;
        fundMaturityDate = _fundMaturityDate;

        // Set cause metadata
        causeName = _causeName;
        causeDescription = _causeDescription;

        // Set emergency withdrawal config
        emergencyWithdrawalAllowed = _emergencyWithdrawalAllowed;
        isEmergencyWithdrawn = false;
    }

    function receiveFund(uint256 _amount, string memory note) external nonReentrant whenNotPaused {
        if (_amount == 0) revert ZeroAmount();

        pyusdToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit FundReceived(msg.sender, note, address(pyusdToken), _amount, block.timestamp);
    }

    function executeEmergencyWithdrawal() external {
        uint256 pyusdBalance = pyusdToken.balanceOf(address(this));

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            Beneficiary memory beneficiary = beneficiaries[i];

            uint256 share = (pyusdBalance * beneficiary.sharePercentage) / 10000;

            if (share > 0) {
                pyusdToken.safeTransfer(beneficiary.wallet, share);
            }
        }

        emit EmergencyWithdrawalExecuted(pyusdBalance, block.timestamp);
    }

    function getWalletBalance() external view returns (uint256) {
        return pyusdToken.balanceOf(address(this));
    }

    /**
     * @notice Get number of beneficiaries
     */
    function getBeneficiaryCount() external view returns (uint256) {
        return beneficiaries.length;
    }

    /**
     * @notice Get all beneficiaries
     */
    function getAllBeneficiaries() external view returns (Beneficiary[] memory) {
        return beneficiaries;
    }
}