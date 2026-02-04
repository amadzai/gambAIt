Architecture Summary

3 Smart Contracts:

1. AgentToken.sol - Simple ERC20 (1B supply, no mint/burn)
2. AgentFactory.sol - Creates agents, deploys tokens, creates Uniswap V4 pools
3. BattleManager.sol - Registers matches, verifies backend signatures, settles LP transfers

Key Flows:

- Create Agent: User pays USDC → 80% seeds LP, 20% tokens to creator
- Trade: Direct swaps on Uniswap V4 (no custom contract needed)
- Battle: Backend signs result → Contract verifies → 10% loser LP → swapped to USDC → added to winner LP

Integration:

- Backend: New blockchain service, event listeners, match orchestrator
- Frontend: wagmi hooks for create/trade, contract addresses config
- Database: Agent and Match models in Prisma

No custom Uniswap V4 hooks - using standard pools for hackathon simplicity.

     Overview

     A platform where users create AI chess agents by paying USDC. Each agent gets its own ERC20 token tradeable on Uniswap V4. Agents battle in chess - losers pay winners through LP transfers, affecting market cap which determines agent skill level (ELO).

     Key Decisions
     ┌────────────────────┬──────────────────────────────────┐
     │      Decision      │              Choice              │
     ├────────────────────┼──────────────────────────────────┤
     │ Chain              │ Base Sepolia or Arbitrum Sepolia │
     ├────────────────────┼──────────────────────────────────┤
     │ Trading Pair       │ AgentToken/USDC                  │
     ├────────────────────┼──────────────────────────────────┤
     │ Token Distribution │ 80% LP / 20% Creator             │
     ├────────────────────┼──────────────────────────────────┤
     │ Battle Stake       │ 10% of LP position               │
     ├────────────────────┼──────────────────────────────────┤
     │ Settlement         │ Instant swap                     │
     ├────────────────────┼──────────────────────────────────┤
     │ Match Verification │ Backend signature                │
     └────────────────────┴──────────────────────────────────┘
     ---
     Contracts Required

     1. AgentToken.sol

     Standard ERC20 token with fixed supply, deployed per agent.

     // Simple ERC20, no mint/burn after creation
     - Fixed supply: 1 billion tokens
     - Minted to factory at deployment
     - No special permissions

     2. AgentFactory.sol

     Creates agents, deploys tokens, initializes Uniswap V4 pools.

     // State
     - usdc, poolManager, positionManager (immutable)
     - agents mapping (token => AgentInfo)
     - creationFee (e.g., 100 USDC)

     // Key Functions
     - createAgent(name, symbol, usdcAmount) → deploys token, creates pool, seeds LP
     - getMarketCap(agentToken) → reads price from pool
     - getAllAgents()

     3. BattleManager.sol

     Handles match registration, stake locking, settlement.

     // State
     - resultSigner (backend wallet address)
     - matches mapping (matchId => Match)
     - usedSignatures mapping (replay protection)

     // Key Functions
     - registerMatch(agent1, agent2) → calculates stakes, records match
     - settleMatch(matchId, winner, signature) → verifies sig, transfers LP
     - cancelMatch(matchId, signature)

     ---
     Integration Flows

     Agent Creation Flow

     User                    Frontend                  Contract                    Backend
       |                        |                         |                           |
       |-- Fill form ---------->|                         |                           |
       |                        |-- approve USDC -------->|                           |
       |                        |-- createAgent() ------->|                           |
       |                        |                         |-- Deploy token            |
       |                        |                         |-- Create Uniswap pool     |
       |                        |                         |-- Seed 80% tokens + USDC  |
       |                        |                         |-- Send 20% to creator     |
       |                        |                         |-- Emit AgentCreated ----->|
       |                        |                         |                           |-- Store in DB

     Token Trading Flow

     - Users trade directly on Uniswap V4 via Universal Router
     - Frontend uses Uniswap SDK for quotes and swaps
     - No custom contract interaction needed
     - Backend monitors Swap events to update market cap

     Battle Settlement Flow

     Backend                     Contract                    Result
        |                            |                          |
        |-- registerMatch() -------->|-- Lock stakes            |
        |                            |-- Emit MatchRegistered   |
        |-- Run chess game           |                          |
        |-- Determine winner         |                          |
        |-- Sign result              |                          |
        |-- settleMatch(sig) ------->|-- Verify signature       |
        |                            |-- Remove 10% loser LP    |
        |                            |-- Swap tokens → USDC     |
        |                            |-- Add USDC to winner LP  |
        |                            |-- Emit MatchSettled ---->|-- Update ELOs

     ---
     Uniswap V4 Integration

     Pool Creation (in AgentFactory.createAgent)

     PoolKey memory poolKey = PoolKey({
         currency0: Currency.wrap(address(usdc)),
         currency1: Currency.wrap(address(token)),
         fee: 3000,           // 0.3% fee
         tickSpacing: 60,
         hooks: IHooks(address(0))  // No custom hooks for simplicity
     });

     poolManager.initialize(poolKey, sqrtPriceX96);
     positionManager.mint(fullRangeParams);

     Settlement (in BattleManager)

     // 1. Decrease loser's LP position
     positionManager.decreaseLiquidity(loserPositionId, liquidityToRemove);
     positionManager.collect(...);

     // 2. Swap loser tokens for USDC
     poolManager.swap(poolKey, swapParams);

     // 3. Add USDC to winner's LP
     positionManager.increaseLiquidity(winnerPositionId, usdcAmount);

     Contract Addresses (Base Sepolia)

     PoolManager:      0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408
     PositionManager:  0x4b2c77d209d3405f41a037ec6c77f7f5b8e2ca80
     UniversalRouter:  0x492e6456d9528771018deb9e87ef7750ef184104
     StateView:        0x571291b572ed32ce6751a2cb2486ebee8defb9b4

     ---
     Backend Changes

     New Services

     1. BlockchainService - Contract interactions (create agent, settle match, sign results)
     2. EventListenerService - Monitor on-chain events
     3. MatchOrchestratorService - Coordinate full match flow

     Database Schema Additions (schema.prisma)

     model Agent {
       id            String    @id
       tokenAddress  String    @unique
       name          String
       symbol        String
       creator       String
       elo           Int       @default(1200)
       marketCap     BigInt
       positionId    BigInt    // Uniswap LP NFT ID
       playstyle     Playstyle
     }

     model Match {
       id             String      @id
       matchIdOnChain Bytes?      @unique
       agent1Id       String
       agent2Id       String
       winnerId       String?
       status         MatchStatus
       settledAt      DateTime?
     }

     Environment Variables

     AGENT_FACTORY_ADDRESS=0x...
     BATTLE_MANAGER_ADDRESS=0x...
     BACKEND_SIGNER_PRIVATE_KEY=0x...
     BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

     ---
     Frontend Changes

     New Hooks (wagmi)

     // useCreateAgent.ts - Call AgentFactory.createAgent()
     // useAgentMarketCap.ts - Read market cap from contract
     // useSwapTokens.ts - Use Uniswap Universal Router

     Config Updates

     // Add Base Sepolia chain to wagmiConfig.ts
     // Add contract addresses to config/contracts.ts
     // Add ABIs for AgentFactory and BattleManager

     ---
     Security Measures

     1. ReentrancyGuard on all state-changing functions
     2. Signature replay protection using usedSignatures mapping
     3. Chain ID + contract address in signed message to prevent cross-chain replay
     4. Access control - only authorized backend can register matches
     5. Input validation on all user inputs

     ---
     Files to Create/Modify

     Smart Contracts (create)

     - dapp/src/AgentToken.sol
     - dapp/src/AgentFactory.sol
     - dapp/src/BattleManager.sol
     - dapp/test/AgentFactory.t.sol
     - dapp/test/BattleManager.t.sol
     - dapp/script/Deploy.s.sol

     Backend (modify/create)

     - backend/prisma/schema.prisma - Add Agent, Match models
     - backend/src/service-modules/blockchain/ - New blockchain service
     - backend/src/service-modules/match/ - New match orchestrator

     Frontend (modify/create)

     - frontend/config/wagmiConfig.ts - Add Base Sepolia
     - frontend/lib/contracts/abis.ts - Add new ABIs
     - frontend/lib/contracts/config.ts - Add contract addresses
     - frontend/hooks/contracts/useCreateAgent.ts
     - frontend/hooks/contracts/useAgentMarketCap.ts

     ---
     Deployment Sequence

     1. Deploy AgentFactory (with Uniswap V4 addresses)
     2. Deploy BattleManager (with AgentFactory address)
     3. Configure AgentFactory with BattleManager address
     4. Set result signer in BattleManager
     5. Test agent creation and pool initialization
     6. Test match registration and settlement

     ---
     Verification Plan

     1. Contract Tests - Run forge test for unit/integration tests
     2. Manual Test Agent Creation - Create agent, verify pool exists on Uniswap
     3. Manual Test Trading - Buy/sell tokens via Universal Router
     4. Manual Test Settlement - Register match, settle, verify LP changes
     5. Frontend Integration - Connect wallet, create agent, view market cap
