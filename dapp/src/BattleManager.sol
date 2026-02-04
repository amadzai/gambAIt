// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import "./AgentFactory.sol";

/**
 * @title BattleManager
 * @notice Manages chess battles between AI agents with LP stake transfers
 * @dev Verifies backend signatures, locks stakes, and settles matches
 */
contract BattleManager is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice AgentFactory contract
    AgentFactory public immutable agentFactory;

    /// @notice Uniswap V4 PoolManager
    IPoolManager public immutable poolManager;

    /// @notice Uniswap V4 PositionManager
    IPositionManager public immutable positionManager;

    /// @notice Backend wallet authorized to sign match results
    address public resultSigner;

    /// @notice Percentage of LP to stake in battles (basis points, 1000 = 10%)
    uint256 public constant STAKE_PERCENTAGE = 1000;

    enum MatchStatus {
        Pending,
        InProgress,
        Completed,
        Cancelled
    }

    struct Match {
        bytes32 matchId;
        address agent1;
        address agent2;
        address winner;
        MatchStatus status;
        uint256 createdAt;
        uint256 settledAt;
    }

    /// @notice Mapping from matchId to Match details
    mapping(bytes32 => Match) public matches;

    /// @notice Prevent signature replay attacks
    mapping(bytes32 => bool) public usedSignatures;

    /// @notice Array of all match IDs
    bytes32[] public allMatches;

    event MatchRegistered(
        bytes32 indexed matchId,
        address indexed agent1,
        address indexed agent2,
        uint256 timestamp
    );

    event MatchSettled(
        bytes32 indexed matchId,
        address indexed winner,
        address indexed loser,
        uint256 timestamp
    );

    event MatchCancelled(
        bytes32 indexed matchId,
        uint256 timestamp
    );

    event ResultSignerUpdated(address indexed newSigner);

    error InvalidAddress();
    error InvalidAgent();
    error MatchAlreadyExists();
    error MatchNotFound();
    error MatchAlreadySettled();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error InvalidWinner();
    error OnlyResultSigner();

    /**
     * @notice Deploy BattleManager
     * @param _agentFactory AgentFactory contract address
     * @param _poolManager Uniswap V4 PoolManager address
     * @param _positionManager Uniswap V4 PositionManager address
     * @param _resultSigner Backend wallet authorized to sign results
     */
    constructor(
        address _agentFactory,
        address _poolManager,
        address _positionManager,
        address _resultSigner
    ) Ownable(msg.sender) {
        if (_agentFactory == address(0) || _poolManager == address(0) ||
            _positionManager == address(0) || _resultSigner == address(0)) {
            revert InvalidAddress();
        }

        agentFactory = AgentFactory(_agentFactory);
        poolManager = IPoolManager(_poolManager);
        positionManager = IPositionManager(_positionManager);
        resultSigner = _resultSigner;
    }

    /**
     * @notice Register a new match between two agents
     * @param agent1 Address of first agent token
     * @param agent2 Address of second agent token
     * @return matchId Unique identifier for the match
     */
    function registerMatch(
        address agent1,
        address agent2
    ) external nonReentrant returns (bytes32 matchId) {
        // Verify both agents exist
        AgentFactory.AgentInfo memory info1 = agentFactory.getAgentInfo(agent1);
        AgentFactory.AgentInfo memory info2 = agentFactory.getAgentInfo(agent2);

        if (!info1.exists || !info2.exists) revert InvalidAgent();
        if (agent1 == agent2) revert InvalidAgent();

        // Generate unique match ID
        matchId = keccak256(abi.encodePacked(
            agent1,
            agent2,
            block.timestamp,
            block.number
        ));

        if (matches[matchId].status != MatchStatus.Pending) {
            revert MatchAlreadyExists();
        }

        // Create match record
        matches[matchId] = Match({
            matchId: matchId,
            agent1: agent1,
            agent2: agent2,
            winner: address(0),
            status: MatchStatus.InProgress,
            createdAt: block.timestamp,
            settledAt: 0
        });

        allMatches.push(matchId);

        emit MatchRegistered(matchId, agent1, agent2, block.timestamp);
    }

    /**
     * @notice Settle a completed match with backend signature
     * @param matchId Match identifier
     * @param winner Address of winning agent token
     * @param signature Backend signature authorizing settlement
     */
    function settleMatch(
        bytes32 matchId,
        address winner,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.status == MatchStatus.Pending) revert MatchNotFound();
        if (matchData.status == MatchStatus.Completed) revert MatchAlreadySettled();
        if (winner != matchData.agent1 && winner != matchData.agent2) revert InvalidWinner();

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            matchId,
            winner,
            block.chainid,
            address(this)
        ));

        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        if (usedSignatures[ethSignedMessageHash]) revert SignatureAlreadyUsed();

        address signer = ethSignedMessageHash.recover(signature);
        if (signer != resultSigner) revert InvalidSignature();

        // Mark signature as used
        usedSignatures[ethSignedMessageHash] = true;

        // Determine loser
        address loser = (winner == matchData.agent1) ? matchData.agent2 : matchData.agent1;

        // Execute LP transfer from loser to winner
        _transferLPStake(loser, winner);

        // Update match status
        matchData.winner = winner;
        matchData.status = MatchStatus.Completed;
        matchData.settledAt = block.timestamp;

        emit MatchSettled(matchId, winner, loser, block.timestamp);
    }

    /**
     * @notice Cancel a match with backend signature
     * @param matchId Match identifier
     * @param signature Backend signature authorizing cancellation
     */
    function cancelMatch(
        bytes32 matchId,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[matchId];

        if (matchData.status == MatchStatus.Pending) revert MatchNotFound();
        if (matchData.status == MatchStatus.Completed) revert MatchAlreadySettled();

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            matchId,
            "cancel",
            block.chainid,
            address(this)
        ));

        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        if (usedSignatures[ethSignedMessageHash]) revert SignatureAlreadyUsed();

        address signer = ethSignedMessageHash.recover(signature);
        if (signer != resultSigner) revert InvalidSignature();

        // Mark signature as used
        usedSignatures[ethSignedMessageHash] = true;

        // Update match status
        matchData.status = MatchStatus.Cancelled;
        matchData.settledAt = block.timestamp;

        emit MatchCancelled(matchId, block.timestamp);
    }

    /**
     * @notice Get match details
     * @param matchId Match identifier
     * @return Match information
     */
    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    /**
     * @notice Get all match IDs
     * @return Array of all match IDs
     */
    function getAllMatches() external view returns (bytes32[] memory) {
        return allMatches;
    }

    /**
     * @notice Update result signer address (only owner)
     * @param _resultSigner New result signer address
     */
    function setResultSigner(address _resultSigner) external onlyOwner {
        if (_resultSigner == address(0)) revert InvalidAddress();
        resultSigner = _resultSigner;
        emit ResultSignerUpdated(_resultSigner);
    }

    // Internal functions

    /**
     * @notice Transfer LP stake from loser to winner
     * @param loser Address of losing agent token
     * @param winner Address of winning agent token
     */
    function _transferLPStake(address loser, address winner) internal {
        AgentFactory.AgentInfo memory loserInfo = agentFactory.getAgentInfo(loser);
        AgentFactory.AgentInfo memory winnerInfo = agentFactory.getAgentInfo(winner);

        uint256 loserPositionId = loserInfo.positionId;
        uint256 winnerPositionId = winnerInfo.positionId;

        // TODO: Implement LP transfer logic using Uniswap V4 PositionManager
        // 1. Get loser's LP position liquidity amount
        // 2. Calculate 10% of liquidity (STAKE_PERCENTAGE)
        // 3. Decrease loser's liquidity by 10%
        // 4. Collect tokens from decreased liquidity
        // 5. Swap loser's agent tokens for USDC
        // 6. Add USDC to winner's LP position

        // This requires proper integration with V4 periphery contracts
        // Placeholder for implementation

        // Note: The actual implementation will depend on:
        // - IPositionManager.decreaseLiquidity()
        // - IPositionManager.collect()
        // - IPoolManager.swap()
        // - IPositionManager.increaseLiquidity()
    }

    /**
     * @notice Verify a signature is from the result signer
     * @param messageHash Hash of the message
     * @param signature Signature to verify
     * @return True if signature is valid
     */
    function _verifySignature(
        bytes32 messageHash,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        return signer == resultSigner;
    }
}
