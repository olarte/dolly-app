// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Market — Pari-mutuel prediction market for USD/local-currency pairs
/// @notice Accepts cUSD (18 dec), USDC (6 dec), USDT (6 dec) on Celo.
///         All internal accounting is normalized to 18 decimals.
contract Market is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ──────────────────────────── Enums ────────────────────────────

    enum Outcome { UNRESOLVED, UP, DOWN }
    enum Side { UP, DOWN }

    // ──────────────────────────── State ────────────────────────────

    bytes32 public currencyPair;
    uint256 public rakeBps;          // 300 = 3%
    uint256 public bettingCloseTime; // deposits blocked after this
    uint256 public resolutionTime;   // resolve() allowed after this

    Outcome public outcome;
    bool public bettingClosed;
    bool public resolved;

    uint256 public openPrice;
    uint256 public closePrice;
    string public sourceId;

    uint256 public totalUp;    // normalized 18-dec
    uint256 public totalDown;  // normalized 18-dec

    // Token allowlist
    mapping(address => bool) public isAllowedToken;
    address[] public allowedTokenList;
    mapping(address => uint8) internal _tokenDecimals;

    // Per-user state
    mapping(address => uint256) public userDepositsUp;   // normalized 18-dec
    mapping(address => uint256) public userDepositsDown;  // normalized 18-dec
    mapping(address => address) public userDepositToken;  // which ERC-20 they used
    mapping(address => bool) public hasClaimed;

    // ──────────────────────────── Events ───────────────────────────

    event Deposited(address indexed user, Side side, address token, uint256 amount);
    event BettingClosed();
    event Resolved(Outcome outcome, uint256 openPrice, uint256 closePrice, string sourceId);
    event Claimed(address indexed user, address token, uint256 payout);
    event RakeCollected(address token, uint256 amount);

    // ──────────────────────────── Constructor ──────────────────────

    constructor(
        address[] memory _allowedTokens,
        bytes32 _currencyPair,
        uint256 _rakeBps,
        uint256 _bettingCloseTime,
        uint256 _resolutionTime,
        address _owner
    ) Ownable(_owner) {
        require(_rakeBps <= 1000, "Rake too high");                // max 10%
        require(_bettingCloseTime < _resolutionTime, "Invalid times");
        require(_allowedTokens.length > 0, "No tokens");

        currencyPair = _currencyPair;
        rakeBps = _rakeBps;
        bettingCloseTime = _bettingCloseTime;
        resolutionTime = _resolutionTime;

        for (uint256 i = 0; i < _allowedTokens.length; i++) {
            address token = _allowedTokens[i];
            require(token != address(0), "Zero address token");
            isAllowedToken[token] = true;
            _tokenDecimals[token] = IERC20Metadata(token).decimals();
            allowedTokenList.push(token);
        }
    }

    // ──────────────────────────── Modifiers ────────────────────────

    modifier whenBettingOpen() {
        require(!bettingClosed && block.timestamp < bettingCloseTime, "Betting closed");
        require(!resolved, "Market resolved");
        _;
    }

    // ──────────────────────────── Deposit ──────────────────────────

    function depositUp(address token, uint256 amount) external nonReentrant whenBettingOpen {
        _deposit(token, amount, Side.UP);
    }

    function depositDown(address token, uint256 amount) external nonReentrant whenBettingOpen {
        _deposit(token, amount, Side.DOWN);
    }

    function _deposit(address token, uint256 amount, Side side) internal {
        require(isAllowedToken[token], "Token not allowed");
        require(amount > 0, "Amount must be > 0");

        // Users must stick to a single token across all their deposits
        address existing = userDepositToken[msg.sender];
        require(existing == address(0) || existing == token, "Must use same token");

        // Pull tokens
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Normalize to 18 decimals
        uint256 normalized = _normalize(token, amount);

        if (side == Side.UP) {
            userDepositsUp[msg.sender] += normalized;
            totalUp += normalized;
        } else {
            userDepositsDown[msg.sender] += normalized;
            totalDown += normalized;
        }

        userDepositToken[msg.sender] = token;

        emit Deposited(msg.sender, side, token, amount);
    }

    // ──────────────────────────── Close Betting ────────────────────

    /// @notice Owner can close early; anyone can close after bettingCloseTime.
    function closeBetting() external {
        require(
            block.timestamp >= bettingCloseTime || msg.sender == owner(),
            "Not authorized"
        );
        require(!bettingClosed, "Already closed");
        bettingClosed = true;
        emit BettingClosed();
    }

    // ──────────────────────────── Resolve ──────────────────────────

    function resolve(
        Outcome _outcome,
        uint256 _openPrice,
        uint256 _closePrice,
        string calldata _sourceId
    ) external onlyOwner {
        require(!resolved, "Already resolved");
        require(_outcome != Outcome.UNRESOLVED, "Invalid outcome");
        require(block.timestamp >= resolutionTime, "Too early");

        outcome = _outcome;
        openPrice = _openPrice;
        closePrice = _closePrice;
        sourceId = _sourceId;
        resolved = true;

        // Auto-close betting if not already done
        if (!bettingClosed) {
            bettingClosed = true;
            emit BettingClosed();
        }

        emit Resolved(_outcome, _openPrice, _closePrice, _sourceId);
    }

    // ──────────────────────────── Claim ────────────────────────────

    function claim() external nonReentrant {
        require(resolved, "Not resolved");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 userWinDeposit;
        uint256 winningSideTotal;

        if (outcome == Outcome.UP) {
            userWinDeposit = userDepositsUp[msg.sender];
            winningSideTotal = totalUp;
        } else {
            userWinDeposit = userDepositsDown[msg.sender];
            winningSideTotal = totalDown;
        }

        require(userWinDeposit > 0, "No winning deposit");

        hasClaimed[msg.sender] = true;

        // Pari-mutuel math (all in normalized 18-dec units)
        uint256 totalPool = totalUp + totalDown;
        uint256 rake = (totalPool * rakeBps) / 10000;
        uint256 payoutPool = totalPool - rake;
        uint256 normalizedPayout = (userWinDeposit * payoutPool) / winningSideTotal;

        // Convert back to the user's original token decimals
        address token = userDepositToken[msg.sender];
        uint256 payout = _denormalize(token, normalizedPayout);
        require(payout > 0, "Payout too small");

        IERC20(token).safeTransfer(msg.sender, payout);

        emit Claimed(msg.sender, token, payout);
    }

    // ──────────────────────────── Rake Withdrawal ──────────────────

    /// @notice Owner withdraws remaining token balance (rake) after claims settle.
    function withdrawRake(address token) external onlyOwner {
        require(resolved, "Not resolved");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance");

        IERC20(token).safeTransfer(owner(), balance);

        emit RakeCollected(token, balance);
    }

    // ──────────────────────────── Views ────────────────────────────

    function getAllowedTokens() external view returns (address[] memory) {
        return allowedTokenList;
    }

    function tokenDecimals(address token) external view returns (uint8) {
        return _tokenDecimals[token];
    }

    function getUserDeposit(address user)
        external
        view
        returns (uint256 upAmount, uint256 downAmount, address token)
    {
        return (userDepositsUp[user], userDepositsDown[user], userDepositToken[user]);
    }

    /// @notice Returns the current multiplier for a side in 18-dec fixed-point (1e18 = 1.0x).
    function getMultiplier(Side side) external view returns (uint256) {
        uint256 totalPool = totalUp + totalDown;
        if (totalPool == 0) return 1e18;

        uint256 sideTotal = side == Side.UP ? totalUp : totalDown;
        if (sideTotal == 0) return 0;

        return (totalPool * (10000 - rakeBps) * 1e18) / (sideTotal * 10000);
    }

    /// @notice Returns total pool in normalized 18-dec units.
    function getTotalPool() external view returns (uint256) {
        return totalUp + totalDown;
    }

    // ──────────────────────────── Internal ─────────────────────────

    /// @dev Scale native-decimal amount up to 18 decimals.
    function _normalize(address token, uint256 amount) internal view returns (uint256) {
        uint8 dec = _tokenDecimals[token];
        if (dec >= 18) return amount;
        return amount * (10 ** (18 - dec));
    }

    /// @dev Scale 18-decimal amount back down to native decimals.
    function _denormalize(address token, uint256 normalizedAmount) internal view returns (uint256) {
        uint8 dec = _tokenDecimals[token];
        if (dec >= 18) return normalizedAmount;
        return normalizedAmount / (10 ** (18 - dec));
    }
}
