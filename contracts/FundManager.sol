// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

// Investment contract interface
interface IInvestmentContract {
    function invest(address sender, uint256 amount) external;
    function withdraw(address sender) external returns (uint256);
}

contract FundManager is Pausable, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Beneficiary {
        address payable wallet;
        uint256 sharePercentage; // In basis points (10000 = 100%)
    }

    struct EmergencyWithdrawal {
        string status;
        uint256 amount;        
    }

    struct EmergencyWithdrawalConfig {
        uint256 requiredNumberofApprovals;
        uint256 timesAllowed;
        uint256 limitPerWithdrawal;
        uint256 totalLimit;
    }

    // Beneficiary config
    Beneficiary[] public beneficiaries;

    // Token address
    IERC20 public immutable token;

    // Fund release parameters
    uint256 public releaseAmount; // In fiat currency with 6 decimals (e.g., 1234000000 = $1234)
    uint256 public immutable fundMaturityDate; // epoch time of fund's maturity date after which payout is allowed.

    // Emergency withdrawal
    EmergencyWithdrawalConfig public emergencyWithdrawalConfig;
    mapping(bytes32 => EmergencyWithdrawal) public emergencyWithdrawals;
    mapping(bytes32 => uint256) public emergencyWithdrawalApprovals;
    mapping(bytes32 => mapping(address => bool)) public hasApprovedEmergencyWithdrawal;
    uint256 public totalWithdrawnAmount;

    // Set cause metadata
    string public causeName;
    string public causeDescription;

    // Multi-sig governance
    address[] public governors;
    mapping(address => bool) public isGovernor;

    event FundReceived(
        address indexed sender,
        string indexed note,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event EmergencyWithdrawalInitiated(
        bytes32 indexed withdrawalId,
        address indexed initiator
    );

    event EmergencyWithdrawalApproved(
        bytes32 indexed withdrawalId,
        address indexed governor,
        uint256 currentApprovals
    );

    event EmergencyWithdrawalExecuted(
        uint256 totalAmount,
        uint256 timestamp
    );

    event FundReleased(
        uint256 totalAmount,
        uint256 timestamp
    );

    event InvestmentMade(
        address indexed investmentContract,
        uint256 amount,
        uint256 timestamp
    );

    event InvestmentWithdrawn(
        address indexed investmentContract,
        uint256 amount,
        uint256 timestamp
    );

    // Errors
    error InvalidMaturityDate();
    error FundNotMatured();
    error InvalidBeneficiaryShares();
    error InvalidTotalSharePercentage();
    error ZeroAmount();
    error InvalidGovernors();
    error NotGovernor();
    error AlreadyApproved();
    error InsufficientTokens();
    error WithdrawalAmountBreachesLimit();
    error TotalWithdrawalLimitBreached();
    error InvalidInvestmentContract();
    error InvestmentFailed();
    error WithdrawalFailed();

     // ============ Modifiers ============

    modifier onlyGovernor() {
        if (!isGovernor[msg.sender]) revert NotGovernor();
        _;
    }

    modifier withdrawalLimitNotBreached(uint256 _amount) {
        if (_amount > emergencyWithdrawalConfig.limitPerWithdrawal) {
            revert WithdrawalAmountBreachesLimit();
        }

        if (totalWithdrawnAmount + _amount > emergencyWithdrawalConfig.totalLimit) {
            revert TotalWithdrawalLimitBreached();
        }

        _;
    }

    modifier tokenBalanceIsSufficient(uint256 _amount) {
        uint256 tokenBalance = token.balanceOf(address(this));
        if (_amount > tokenBalance) {
            revert InsufficientTokens();
        }
        _;
    }

    constructor (
        address[] memory _beneficiaryAddresses,
        uint256[] memory _sharePercentages,
        address _tokenAddress,
        uint256 _releaseAmount,
        uint256 _fundMaturityDate,
        string memory _causeName,
        string memory _causeDescription,
        address[] memory _governors,
        uint256 _requiredNumberofApprovalsForWithdrawal,
        uint256 _timesEmergencyWithdrawalAllowed,
        uint256 _limitPerEmergencyWithdrawal,
        uint256 _totalLimitForEmergencyWithdrawal
    ) Ownable(msg.sender) {
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
        token = IERC20(_tokenAddress);

        // Set fund release parameters
        releaseAmount = _releaseAmount; // In fiat currency with 6 decimals (e.g., 1234000000 = $1234)
        fundMaturityDate = _fundMaturityDate;

        // Set cause metadata
        causeName = _causeName;
        causeDescription = _causeDescription;

        // Setup multi-sig governance
        if (_governors.length == 0 || _requiredNumberofApprovalsForWithdrawal == 0 || 
            _requiredNumberofApprovalsForWithdrawal > _governors.length) {
            revert InvalidGovernors();
        }

        for (uint256 i = 0; i < _governors.length; i++) {
            if (_governors[i] == address(0) || isGovernor[_governors[i]]) {
                revert InvalidGovernors();
            }
            governors.push(_governors[i]);
            isGovernor[_governors[i]] = true;
        }

        // Set emergency withdrawal config
        emergencyWithdrawalConfig.requiredNumberofApprovals = _requiredNumberofApprovalsForWithdrawal;
        emergencyWithdrawalConfig.timesAllowed = _timesEmergencyWithdrawalAllowed;
        emergencyWithdrawalConfig.limitPerWithdrawal = _limitPerEmergencyWithdrawal;
        emergencyWithdrawalConfig.totalLimit = _totalLimitForEmergencyWithdrawal;
    }

    function contributeFund(uint256 _amount, string memory note) external nonReentrant whenNotPaused {
        if (_amount == 0) revert ZeroAmount();

        token.safeTransferFrom(msg.sender, address(this), _amount);
        emit FundReceived(msg.sender, note, address(token), _amount, block.timestamp);
    }

    function releaseRegularPension(uint256 _inflationCoefficient) external nonReentrant whenNotPaused {
        // Check if fund has matured
        if (block.timestamp < fundMaturityDate) {
            revert FundNotMatured();
        }

        // Calculate final amount to be released
        uint256 finalAmount = releaseAmount * _inflationCoefficient;

        // Check if contract wallet balance is greater than final amount
        uint256 tokenBalance = token.balanceOf(address(this));
        if (tokenBalance < finalAmount) {
            revert InsufficientTokens();
        }

        // Calculate split and transfer to each beneficiary
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            Beneficiary memory beneficiary = beneficiaries[i];
            
            uint256 share = (finalAmount * beneficiary.sharePercentage) / 10000;

            if (share > 0) {
                token.safeTransfer(beneficiary.wallet, share);
            }
        }

        emit FundReleased(finalAmount, block.timestamp);
    }

    // ============ Emergency Withdrawal Functions ============
    /**
     * @notice Initiate emergency withdrawal (requires multi-sig)
     * @return withdrawalId Unique ID for this withdrawal request
     */
    function initiateEmergencyWithdrawal(uint256 _amount)
        external
        onlyGovernor
        nonReentrant
        withdrawalLimitNotBreached(_amount)
        returns (bytes32 withdrawalId) 
    {
        withdrawalId = keccak256(abi.encodePacked(
            "EMERGENCY_WITHDRAWAL",
            block.timestamp,
            msg.sender
        ));

        EmergencyWithdrawal memory withdrawal = EmergencyWithdrawal({
            status: "INITIATED",
            amount: _amount
        });
        
        emergencyWithdrawals[withdrawalId] = withdrawal;
        emergencyWithdrawalApprovals[withdrawalId] = 1;
        hasApprovedEmergencyWithdrawal[withdrawalId][msg.sender] = true;

        emit EmergencyWithdrawalInitiated(withdrawalId, msg.sender);
        emit EmergencyWithdrawalApproved(withdrawalId, msg.sender, 1);
    }

    /**
     * @notice Approve emergency withdrawal
     * @param withdrawalId ID of the withdrawal request
     */
    function approveEmergencyWithdrawal(bytes32 withdrawalId) 
        external 
        onlyGovernor
    {
        if (hasApprovedEmergencyWithdrawal[withdrawalId][msg.sender]) {
            revert AlreadyApproved();
        }

        hasApprovedEmergencyWithdrawal[withdrawalId][msg.sender] = true;
        emergencyWithdrawalApprovals[withdrawalId]++;

        emit EmergencyWithdrawalApproved(
            withdrawalId,
            msg.sender,
            emergencyWithdrawalApprovals[withdrawalId]
        );
    }

    function executeEmergencyWithdrawal(bytes32 withdrawalId)
        external
        onlyGovernor
        nonReentrant
        withdrawalLimitNotBreached(emergencyWithdrawals[withdrawalId].amount)
        tokenBalanceIsSufficient(emergencyWithdrawals[withdrawalId].amount)
    {
        uint256 amount = emergencyWithdrawals[withdrawalId].amount;
        
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            Beneficiary memory beneficiary = beneficiaries[i];

            uint256 share = (amount * beneficiary.sharePercentage) / 10000;

            if (share > 0) {
                token.safeTransfer(beneficiary.wallet, share);
            }
        }

        totalWithdrawnAmount+= amount;
        emit EmergencyWithdrawalExecuted(amount, block.timestamp);
    }

    function getWalletBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
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

    // ============ Investment Functions ============
    /**
     * @notice Invest funds into an investment contract
     * @param _investmentContract Address of the investment contract
     * @param _amount Amount of tokens to invest
     */
    function investFund(address _investmentContract, uint256 _amount)
        external
        onlyOwner
        nonReentrant
        whenNotPaused
    {
        if (_investmentContract == address(0)) {
            revert InvalidInvestmentContract();
        }

        if (_amount == 0) {
            revert ZeroAmount();
        }

        uint256 tokenBalance = token.balanceOf(address(this));
        if (_amount > tokenBalance) {
            revert InsufficientTokens();
        }

        // Approve investment contract to spend tokens
        // require(token.approve(_investmentContract, _amount), "Token approval failed");
        token.forceApprove(_investmentContract, _amount);

        // Call invest function on investment contract
        try IInvestmentContract(_investmentContract).invest(address(this), _amount) {
            emit InvestmentMade(_investmentContract, _amount, block.timestamp);
        } catch {
            revert InvestmentFailed();
        }
    }

    /**
     * @notice Withdraw funds from an investment contract
     * @param _investmentContract Address of the investment contract
     * @return withdrawnAmount Amount of tokens withdrawn
     */
    function withdrawInvestment(address _investmentContract)
        external
        onlyOwner
        nonReentrant
        returns (uint256 withdrawnAmount)
    {
        if (_investmentContract == address(0)) {
            revert InvalidInvestmentContract();
        }

        // Get balance before withdrawal
        uint256 balanceBefore = token.balanceOf(address(this));

        // Call withdraw function on investment contract
        // The investment contract should transfer tokens back to this contract
        IInvestmentContract(_investmentContract).withdraw(address(this));

        // Get balance after withdrawal to verify tokens were received
        uint256 balanceAfter = token.balanceOf(address(this));
        withdrawnAmount = balanceAfter - balanceBefore;

        if (withdrawnAmount == 0) {
            revert WithdrawalFailed();
        }

        emit InvestmentWithdrawn(_investmentContract, withdrawnAmount, block.timestamp);
        return withdrawnAmount;
    }
}