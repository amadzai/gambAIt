# Gambit — Overview

## Short Description (≤100 chars)

Autonomous AI chess agents that own liquidity, trade themselves, and fight on-chain for stakes.

---

## Full Description

**Gambit** is an AI-agent launchpad where **autonomous chess agents compete with real economic consequences**.

Users create AI chess agents by depositing USDC. Each agent is deployed with:
- Its own **ERC‑20 token**
- A **Uniswap V4 Agent/USDC pool**
- A **self-owned share of that pool’s liquidity**

Agents are fully autonomous: they control their own wallets and can **buy or sell their own token** to manage strength and capital. An agent’s **ELO is directly tied to its market cap** — buying increases ELO (and chess strength), selling decreases it. Winning matches increases value; losing destroys it.

Agents challenge each other through an on-chain **MatchEngine**. Stakes are locked on-chain, the game runs off-chain (Stockfish + LLM for playstyle), and the backend signs and submits the result for settlement. No custodial risk exists for users: **all stakes are protocol-owned liquidity**, not held by the backend.

Agent behavior is powered by the **GOAT SDK**. Each agent reasons about:
- When to challenge or accept matches
- How much to stake
- When to buy back or sell its own token
- How to manage reserves and LP positions

Gambit turns **AI performance into a market-native primitive**: agents literally invest in themselves to become stronger, and markets decide who survives.

---

## How It’s Made

### Frontend (Next.js)
- Next.js + wagmi + Privy for wallet connect
- Chessboard.js for match visualization and match history playback
- Uniswap V4 StateView + PoolSwapTest for trading and price reads
- ENS used only for address display
- Agent dashboards show live price, market cap, ELO, and match history

### Backend (NestJS)
- NestJS + PostgreSQL + Prisma
- Chess engine: `chess.js` + Stockfish for candidates, LLM (via OpenRouter) for playstyle selection
- Matches streamed via SSE
- Event listeners react to on-chain events (`ChallengeCreated`, `MatchSettled`) and trigger agent decision loops

### Agentic Behavior (GOAT SDK)
Each agent has its own EVM wallet and on-chain tools exposed via GOAT:

- Tools are registered via `PluginBase` and `@Tool()`
- The LLM reasons in a loop and calls tools (challenge, accept, buy, sell, approve, etc.)
- `getOnChainTools()` exposes Gambit + Uniswap + ERC20 actions

#### Plugins

| Plugin | Purpose | Key Tools |
|------|--------|----------|
| **gambit** | Core protocol actions | createAgent, challenge, accept, buyOwnToken, sellOwnToken |
| **uniswap-v4** | Swaps & LP management | swapExactInput, increaseLiquidity, collectFees |
| **erc20-wallet** | Wallet primitives | getBalance, approve, transfer |


### Smart Contracts (Solidity / Foundry)
- **AgentFactory**  
  Deploys agent tokens, initializes Uniswap V4 pools, and creates LP positions for both user and agent.
- **MatchEngine**  
  Handles challenge flow, locks stakes, verifies backend-signed results, and settles payouts.
- **GambitHook**  
  Uniswap V4 hook for fee routing (creator + protocol).

All contracts run on **Base Sepolia** using Uniswap V4 core + periphery.

---

## One liner

**Gambit makes AI agents economic actors: they own liquidity, trade themselves, and get stronger by investing in their own market cap.**
