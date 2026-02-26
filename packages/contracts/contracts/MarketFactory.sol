// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Market.sol";

/// @title MarketFactory — Deploys and registers Market contracts via CREATE2.
/// @notice Deterministic market addresses derived from currencyPair + marketType + startDate.
contract MarketFactory is Ownable {

    // ──────────────────────────── State ────────────────────────────

    address[] internal _allMarkets;
    mapping(bytes32 => address[]) internal _marketsByCurrency;
    mapping(bytes32 => address) public marketByKey; // key = keccak256(pair, type, date)

    // ──────────────────────────── Events ───────────────────────────

    event MarketCreated(
        address indexed market,
        bytes32 indexed currencyPair,
        uint8 marketType,
        uint256 startDate,
        uint256 endDate,
        uint256 rakeBps
    );

    // ──────────────────────────── Constructor ──────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────── Create ───────────────────────────

    /// @notice Deploy a new Market with deterministic CREATE2 address.
    /// @param currencyPair  e.g. keccak256("USD/COP")
    /// @param marketType    0 = daily, 1 = weekly, 2 = monthly, 3+ = special
    /// @param startDate     Market period start (unix timestamp)
    /// @param endDate       Resolution time (unix timestamp)
    /// @param rakeBps       Rake in basis points (300 = 3%)
    /// @param allowedTokens ERC-20 addresses accepted for deposits
    function createMarket(
        bytes32 currencyPair,
        uint8 marketType,
        uint256 startDate,
        uint256 endDate,
        uint256 rakeBps,
        address[] calldata allowedTokens
    ) external onlyOwner returns (address) {
        bytes32 key = keccak256(abi.encodePacked(currencyPair, marketType, startDate));
        require(marketByKey[key] == address(0), "Market already exists");
        require(endDate > startDate, "Invalid dates");

        // Betting closes 10 minutes before resolution
        uint256 bettingCloseTime = endDate - 600;
        require(bettingCloseTime > startDate, "Duration too short");

        // CREATE2 deploy with deterministic salt
        Market market = new Market{salt: key}(
            allowedTokens,
            currencyPair,
            rakeBps,
            bettingCloseTime,
            endDate,
            owner()       // factory owner controls all markets
        );

        address addr = address(market);
        _allMarkets.push(addr);
        _marketsByCurrency[currencyPair].push(addr);
        marketByKey[key] = addr;

        emit MarketCreated(addr, currencyPair, marketType, startDate, endDate, rakeBps);

        return addr;
    }

    // ──────────────────────────── Views ────────────────────────────

    function getMarketsByCurrency(bytes32 currencyPair) external view returns (address[] memory) {
        return _marketsByCurrency[currencyPair];
    }

    function getMarket(
        bytes32 currencyPair,
        uint8 marketType,
        uint256 date
    ) external view returns (address) {
        bytes32 key = keccak256(abi.encodePacked(currencyPair, marketType, date));
        return marketByKey[key];
    }

    function allMarkets() external view returns (address[] memory) {
        return _allMarkets;
    }

    function marketCount() external view returns (uint256) {
        return _allMarkets.length;
    }
}
