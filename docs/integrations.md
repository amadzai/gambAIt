# Partner Integrations

This document points to where partner technologies are used in the Gambit codebase.

---

## Uniswap V4

We use **Uniswap V4** in three main areas: (1) frontend for swapping/buying/selling agent tokens, (2) backend where the AI agent uses Uniswap via prompts and plugins, and (3) smart contracts where we deploy agent tokens as liquidity pools.

### 1. Frontend — Swapping / Buying & Selling Tokens

| Location | Purpose |
|----------|---------|
| **`frontend/lib/contracts/uniswap.ts`** | Uniswap V4 address config, pool key/PoolId helpers, sqrt price limits, and price conversion. Used by all frontend swap flows. |
| **`frontend/hooks/useAgentContract.ts`** | Main hook for agent token trading: reads pool state via StateView (`getSlot0`), executes **buy** (USDC → AgentToken) and **sell** (AgentToken → USDC) via **PoolSwapTest** `swap()`. Lines ~70–79 (addresses), ~86–98 (price from slot0), ~142–226 (buy: approve USDC + swap), ~228–313 (sell: approve token + swap). |
| **`frontend/components/marketplace/trade-panel.tsx`** | UI for buy/sell: uses `TOKEN_DECIMALS` from `@/lib/contracts/uniswap`, wires `onBuy`/`onSell` to the swap flow (approve + swap). |
| **`frontend/hooks/useDashboard.ts`** | Batch-reads Uniswap prices for marketplace agents via StateView (`getSlot0`) and `getUniswapAddresses()`. |
| **`frontend/hooks/useMyDashboard.ts`** | Same pattern: batch Uniswap price reads for “My Dashboard” agents. |
| **`frontend/lib/contracts/abis.ts`** | ABIs for Uniswap V4 **StateView** (read pool state) and **PoolSwapTest** (execute swaps). |

So: **swap execution** is in `useAgentContract.ts` (PoolSwapTest `swap`); **price display** uses StateView in that hook and in the dashboard hooks; **config/helpers** live in `frontend/lib/contracts/uniswap.ts`.

### 2. Backend — Agent Uses Uniswap (Prompts + Plugins)

| Location | Purpose |
|----------|---------|
| **`backend/src/service-modules/goat/ai/ai-agent.service.ts`** | **Prompt**: System prompt tells the agent it can “Swap tokens through Uniswap V4 pools” and how to buy/sell own token (approve PoolSwapTest, then `buyOwnToken` / `sellOwnToken`). **Plugins**: Registers `uniswapV4(...)` and `gambit(...)` (which includes AgentFactory buy/sell). Uses `UNISWAP_V4.POOL_SWAP_TEST` in the prompt text. |
| **`backend/src/service-modules/goat/goat.service.ts`** | **Prompt**: Reserve-management prompt instructs the agent to use `approveUsdc` with `UNISWAP_V4.POOL_SWAP_TEST` and then `buyOwnToken`, or `approveToken` + `sellOwnToken` for selling. |
| **`backend/src/service-modules/goat/events/match-event-listener.service.ts`** | **Prompt**: Post-match prompt tells the opponent agent to approve tokens for `UNISWAP_V4.POOL_SWAP_TEST` before selling. |
| **`backend/src/service-modules/goat/constants/contracts.ts`** | **Config**: Base Sepolia Uniswap V4 addresses (PoolManager, PositionManager, PoolSwapTest, Quoter, etc.). |
| **`backend/src/service-modules/goat/plugins/uniswap-v4/`** | **Uniswap V4 plugin** for the agent: |
| → **`uniswap-v4.plugin.ts`** | Defines the Uniswap V4 plugin and hooks it into GOAT tools. |
| → **`swap.service.ts`** | Tools: `swapExactInput` (PoolSwapTest swap), `getQuote` (Quoter). |
| → **`position.service.ts`** | Tools: `getPositionInfo`, `increaseLiquidity`, `decreaseLiquidity`, `collectFees` (PositionManager). |
| **`backend/src/service-modules/goat/plugins/gambit/agent-factory.service.ts`** | **Gambit plugin**: Tools `createAgent`, `buyOwnToken`, `sellOwnToken` — all describe using “Uniswap V4” for the pool/swap; `buyOwnToken` / `sellOwnToken` execute swaps via the AgentFactory contract (which in turn uses Uniswap V4). |

So: **prompts** that mention Uniswap V4 and PoolSwapTest live in `ai-agent.service.ts`, `goat.service.ts`, and `match-event-listener.service.ts`; **tools** that call Uniswap V4 live in the `uniswap-v4` plugin (swap + position) and in the `gambit` plugin (AgentFactory create/buy/sell).

### 3. Contracts — AgentFactory Deploys LP on Uniswap V4

| Location | Purpose |
|----------|---------|
| **`dapp/src/AgentFactory.sol`** | **Uniswap V4 integration**: Imports v4-core/v4-periphery (`IPoolManager`, `IPositionManager`, `PoolKey`, `Actions`, `LiquidityAmounts`, etc.). Creates a **Uniswap V4 pool** per agent (AgentToken/USDC), initializes it, then adds **two LP positions** (user LP + agent LP) via PositionManager. |
| → Pool creation | `_createPoolKey`, `poolManager.initialize(poolKey, sqrtPriceX96)` — see comments “Create Uniswap V4 pool” and “Initialize pool with 1:1 price” (~lines 204–214). |
| → LP deployment | `_addLiquidity(poolKey, ...)` adds liquidity via **PositionManager** `modifyLiquidities`; user and agent each get an LP position (~lines 234–239, 444–502). |
| → Buy/sell on V4 | `buyOwnToken` / `sellOwnToken` use the same pool via PositionManager-encoded swap actions (SWAP_EXACT_IN_SINGLE, SETTLE, TAKE) (~lines 345–389, and sell logic later in file). |
| **`dapp/src/GambitHook.sol`** | Uniswap V4 **hook** for the pool (when used): fee split (e.g. 3% creator, 2% protocol). Pool creation in AgentFactory can target this hook. |
| **`dapp/remappings.txt`** | Remappings for `@uniswap/v4-core` and `@uniswap/v4-periphery`. |
| **`dapp/script/Deploy.s.sol`** | References Base Sepolia Uniswap V4 addresses for deployment. |

So: **deploy as LP** = AgentFactory creates the pool and mints two LP positions (user + agent) on Uniswap V4; **swap path** for buy/sell in-contract goes through the same V4 pool via PositionManager.

---

## ENS (Ethereum Name Service)

We use **ENS** only to **show the user’s ENS name instead of their wallet address** in the UI.

| Location | Purpose |
|----------|---------|
| **`frontend/config/wagmiConfig.ts`** | Wagmi config includes **mainnet** solely for ENS resolution: comment states “mainnet is included solely for ENS name resolution”. ENS resolution runs on mainnet. |
| **`frontend/components/marketplace/marketplace-nav.tsx`** | Resolves and displays ENS name: `useEnsName({ address, chainId: mainnet.id })` (line ~45). In the nav button, we show `ensName ?? truncated wallet address` (lines ~158–161), so users see their ENS name when available, otherwise the shortened address. |

No other ENS usage (e.g. reverse resolution elsewhere, or primary name resolution) is implemented in the repo; this is display-only in the marketplace nav.
