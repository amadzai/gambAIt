// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import "./AgentToken.sol";

/**
 * @title AgentFactory
 * @notice Creates AI chess agents with tradeable ERC20 tokens on Uniswap V4
 * @dev Deploys tokens, initializes pools, and manages liquidity positions
 */
contract AgentFactory is ReentrancyGuard, Ownable, IERC721Receiver {

    /// @notice USDC token address (immutable)
    IERC20 public immutable usdc;

    /// @notice Uniswap V4 PoolManager
    IPoolManager public immutable poolManager;

    /// @notice Uniswap V4 PositionManager
    IPositionManager public immutable positionManager;

    /// @notice BattleManager contract address
    address public battleManager;

    /// @notice Fee to create an agent (in USDC, 6 decimals)
    uint256 public creationFee;

    /// @notice Percentage of tokens going to LP (basis points, 8000 = 80%)
    uint256 public constant LP_PERCENTAGE = 8000;

    /// @notice Percentage of tokens going to creator (basis points, 2000 = 20%)
    uint256 public constant CREATOR_PERCENTAGE = 2000;

    /// @notice Uniswap V4 pool fee (3000 = 0.3%)
    uint24 public constant POOL_FEE = 3000;

    /// @notice Uniswap V4 tick spacing
    int24 public constant TICK_SPACING = 60;

    struct AgentInfo {
        address tokenAddress;
        string name;
        string symbol;
        address creator;
        uint256 positionId;
        uint256 createdAt;
        bool exists;
    }

    /// @notice Mapping from token address to agent info
    mapping(address => AgentInfo) public agents;

    /// @notice Array of all agent token addresses
    address[] public allAgents;

    /// @notice Mapping from position NFT ID to agent token address
    mapping(uint256 => address) public positionToAgent;

    event AgentCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed creator,
        uint256 positionId,
        uint256 usdcAmount
    );

    event BattleManagerUpdated(address indexed newBattleManager);
    event CreationFeeUpdated(uint256 newFee);

    error InvalidAddress();
    error InvalidAmount();
    error AgentAlreadyExists();
    error InsufficientUSDC();
    error PoolInitializationFailed();
    error LiquidityAdditionFailed();

    /**
     * @notice Deploy the AgentFactory
     * @param _usdc USDC token address
     * @param _poolManager Uniswap V4 PoolManager address
     * @param _positionManager Uniswap V4 PositionManager address
     * @param _creationFee Initial creation fee in USDC
     */
    constructor(
        address _usdc,
        address _poolManager,
        address _positionManager,
        uint256 _creationFee
    ) Ownable(msg.sender) {
        if (_usdc == address(0) || _poolManager == address(0) || _positionManager == address(0)) {
            revert InvalidAddress();
        }

        usdc = IERC20(_usdc);
        poolManager = IPoolManager(_poolManager);
        positionManager = IPositionManager(_positionManager);
        creationFee = _creationFee;
    }

    /**
     * @notice Create a new AI agent with tradeable token
     * @param name Token name
     * @param symbol Token symbol
     * @param usdcAmount Amount of USDC to seed liquidity pool
     * @return tokenAddress Address of newly created agent token
     */
    function createAgent(
        string calldata name,
        string calldata symbol,
        uint256 usdcAmount
    ) external nonReentrant returns (address tokenAddress) {
        if (usdcAmount < creationFee) revert InsufficientUSDC();

        // Transfer USDC from creator
        if (!usdc.transferFrom(msg.sender, address(this), usdcAmount)) {
            revert InsufficientUSDC();
        }

        // Deploy new agent token
        AgentToken token = new AgentToken(name, symbol, address(this));
        tokenAddress = address(token);

        if (agents[tokenAddress].exists) revert AgentAlreadyExists();

        // Calculate token distribution
        uint256 totalSupply = token.totalSupply();
        uint256 lpTokens = (totalSupply * LP_PERCENTAGE) / 10000;
        uint256 creatorTokens = (totalSupply * CREATOR_PERCENTAGE) / 10000;

        // Create Uniswap V4 pool
        PoolKey memory poolKey = _createPoolKey(tokenAddress);

        // Initialize pool with 1:1 price (adjust sqrtPriceX96 as needed)
        uint160 sqrtPriceX96 = uint160(79228162514264337593543950336); // 1:1 price

        try poolManager.initialize(poolKey, sqrtPriceX96) {
            // Pool initialized successfully
        } catch {
            revert PoolInitializationFailed();
        }

        // Approve tokens for position manager
        token.approve(address(positionManager), lpTokens);
        usdc.approve(address(positionManager), usdcAmount);

        // Add liquidity to pool (full range position)
        uint256 positionId = _addLiquidity(poolKey, lpTokens, usdcAmount);

        if (positionId == 0) revert LiquidityAdditionFailed();

        // Transfer creator tokens
        token.transfer(msg.sender, creatorTokens);

        // Store agent info
        agents[tokenAddress] = AgentInfo({
            tokenAddress: tokenAddress,
            name: name,
            symbol: symbol,
            creator: msg.sender,
            positionId: positionId,
            createdAt: block.timestamp,
            exists: true
        });

        allAgents.push(tokenAddress);
        positionToAgent[positionId] = tokenAddress;

        emit AgentCreated(tokenAddress, name, symbol, msg.sender, positionId, usdcAmount);
    }

    /**
     * @notice Get market cap of an agent in USDC
     * @param agentToken Address of agent token
     * @return Market cap in USDC (estimated from pool reserves)
     */
    function getMarketCap(address agentToken) external view returns (uint256) {
        if (!agents[agentToken].exists) return 0;

        // TODO: Read price from Uniswap V4 pool using StateView or slot0
        // For now, return 0 (implement based on V4 pool state reading)
        return 0;
    }

    /**
     * @notice Get all agent addresses
     * @return Array of all agent token addresses
     */
    function getAllAgents() external view returns (address[] memory) {
        return allAgents;
    }

    /**
     * @notice Get agent info by token address
     * @param tokenAddress Agent token address
     * @return Agent information
     */
    function getAgentInfo(address tokenAddress) external view returns (AgentInfo memory) {
        return agents[tokenAddress];
    }

    /**
     * @notice Update BattleManager address (only owner)
     * @param _battleManager New BattleManager address
     */
    function setBattleManager(address _battleManager) external onlyOwner {
        if (_battleManager == address(0)) revert InvalidAddress();
        battleManager = _battleManager;
        emit BattleManagerUpdated(_battleManager);
    }

    /**
     * @notice Update creation fee (only owner)
     * @param _creationFee New creation fee in USDC
     */
    function setCreationFee(uint256 _creationFee) external onlyOwner {
        creationFee = _creationFee;
        emit CreationFeeUpdated(_creationFee);
    }

    /**
     * @notice Transfer LP NFT ownership to BattleManager for settlement
     * @param positionId Position NFT ID
     */
    function transferPositionToBattleManager(uint256 positionId) external {
        require(msg.sender == battleManager, "Only BattleManager");
        // Transfer LP NFT to BattleManager for settlement
        // Implementation depends on PositionManager interface
    }

    /**
     * @notice Required to receive ERC721 LP NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // Internal functions

    function _createPoolKey(address tokenAddress) internal view returns (PoolKey memory) {
        // Ensure currency0 < currency1
        (Currency currency0, Currency currency1) = address(usdc) < tokenAddress
            ? (Currency.wrap(address(usdc)), Currency.wrap(tokenAddress))
            : (Currency.wrap(tokenAddress), Currency.wrap(address(usdc)));

        return PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(0)) // No custom hooks
        });
    }

    function _addLiquidity(
        PoolKey memory poolKey,
        uint256 tokenAmount,
        uint256 usdcAmount
    ) internal returns (uint256 positionId) {
        // Create full range liquidity position
        // Note: Actual implementation depends on IPositionManager interface
        // This is a placeholder that needs to be adapted to the actual V4 periphery API

        int24 tickLower = TickMath.minUsableTick(TICK_SPACING);
        int24 tickUpper = TickMath.maxUsableTick(TICK_SPACING);

        // TODO: Call positionManager.mint() with proper parameters
        // Return the minted position NFT ID

        // Placeholder return
        return 1;
    }
}
