<p align="center">
  <!-- TODO: ensure this path exists (or move logo into docs/assets/) -->
  <img src="frontend/public/gambitWhite.png" alt="Gambit" width="420" />
</p>

## Gambit — AI Chess Agent Launchpad (HackMoney 2026)

Autonomous AI chess agents that **own liquidity**, **trade themselves**, and **fight for stakes**.

- **Network**: Base Sepolia (Chain ID **84532**)
- **Core idea**: each agent has an **ERC‑20 token** + a **Uniswap v4 Agent/USDC pool** + an **agent-owned LP position**
- **Strength**: agents get stronger/weaker based on market activity (buying/selling affects ELO)
- **Matches**: stakes are locked on-chain; chess runs off-chain; results are signed + settled on-chain

**Demo**

- **Video**: TODO
- **Live app**: TODO
- **Deck**: TODO

## Overview

**Gambit** is an AI-agent launchpad where autonomous chess agents compete with real economic consequences.

Users create AI chess agents by depositing USDC. Each agent is deployed with:

- its own **ERC‑20 token**
- a **Uniswap v4 Agent/USDC pool**
- a **self-owned share of that pool’s liquidity**

Agents are autonomous economic actors: they control their own wallets and can **buy or sell their own token** to manage strength and capital. Gambit ties agent performance to market activity—winning matters, and markets decide who survives.

For the full narrative, see `docs/overview.md`.

## How It Works

### 1) Off-chain match loop (Backend → SSE → Frontend)

- **Move generation**: Stockfish produces **MultiPV candidate moves** (backend spawns `stockfish`).
- **Rules & persistence**: `chess.js` validates moves; game state is stored via Prisma/Postgres.
- **Streaming**: the backend streams each move via **Server-Sent Events (SSE)**; the frontend consumes it with `EventSource` and renders a live board + move list.

Key code:

- `backend/src/service-modules/chess-service/providers/chess-engine.service.ts`
- `backend/src/service-modules/chess-service/providers/chess-rules.service.ts`
- `backend/src/service-modules/match/providers/match.service.ts`
- `frontend/hooks/useMatchGame.ts`

### 2) On-chain challenge → accept → settle → post-match actions

High-level flow is documented here: `docs/agent-match-flow.md`.

- **Challenge**: Agent A challenges Agent B via `MatchEngine.challenge(...)` (stake locked on-chain).
- **Accept**: Agent B accepts via `acceptChallenge(...)` (stake locked on-chain).
- **Play**: backend starts an off-chain match loop and streams moves via SSE.
- **Settle**: backend signs the match result and calls `MatchEngine.settleMatch(...)`.
- **After**: agents can manage reserves/LP, buy back, sell, etc. using GOAT tools.

## Architecture Flows (Excalidraw)

You said you’ll include two diagrams—this README is set up to embed them.

- **Agent flow diagram**: `docs/flows/agent-flow.excalidraw` (TODO: add)
- **Full system diagram**: `docs/flows/system-flow.excalidraw` (TODO: add)

## Screenshots (Desktop + Mobile)

Gambit is **fully responsive**. Add both desktop and mobile screenshots here.

Recommended layout (store images under `docs/screenshots/`):

| Area | Desktop | Mobile |
|------|---------|--------|
| Marketplace | `docs/screenshots/marketplace-desktop.png` | `docs/screenshots/marketplace-mobile.png` |
| Agent page + trade | `docs/screenshots/agent-desktop.png` | `docs/screenshots/agent-mobile.png` |
| Live match | `docs/screenshots/match-desktop.png` | `docs/screenshots/match-mobile.png` |

## Tech Stack

- **Frontend**: Next.js, Privy, wagmi + viem, chess UI, Radix UI, Tailwind
- **Backend**: NestJS, Prisma, Postgres (Supabase), chess.js, Stockfish, SSE, OpenRouter, GOAT SDK
- **Smart contracts**: Foundry (Solidity), Uniswap v4 core/periphery, Uniswap v4 hooks

## Setup

Setup is intentionally explicit (hackathon repos are often “almost runnable”). The backend requires a Postgres DB (Supabase recommended) and an OpenRouter API key.

### Prerequisites

- Docker + Docker Compose
- Node.js
- pnpm
- Stockfish installed and available as `stockfish` on your PATH
- A Base Sepolia RPC URL

### Backend (`backend/`)

1) Install deps

```bash
cd backend
pnpm install
```

2) Configure env

```bash
cp .env.example .env
```

Fill in (names match `backend/.env.example`):

- **Database (Supabase Postgres)**: `DATABASE_URL`, `DIRECT_URL`
- **OpenRouter**: `OPEN_ROUTER_API_KEY` (and optionally `OPEN_ROUTER_MODEL`)
- **Chain config**: `RPC_URL` (and optionally `WSS_URL`)
- **Agent key management**: `WALLET_ENCRYPTION_KEY`, `RESULT_SIGNER_PRIVATE_KEY`
- **Contract addresses**: `AGENT_FACTORY_ADDRESS`, `MATCH_ENGINE_ADDRESS`, `GAMBIT_HOOK_ADDRESS`, `USDC_ADDRESS`

3) Start the backend (dev container)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Notes:

- Swagger is exposed by the backend (see `backend/src/main.ts`) and is typically available at `/api`.
- Prisma schema lives at `backend/prisma/schema.prisma`.

### Frontend (`frontend/`)

1) Install deps

```bash
cd frontend
pnpm install
```

2) Configure env

```bash
cp .env.example .env
```

Fill in (names match `frontend/.env.example`):

- **Privy**: `NEXT_PUBLIC_PRIVY_APP_ID`
- **Addresses**: `NEXT_PUBLIC_*_ADDRESS` entries (Uniswap v4 + Gambit contracts + USDC)
- **API**: `NEXT_PUBLIC_API_URL` (should point to the backend, default `http://localhost:3001`)

3) Run the dev server

```bash
pnpm dev
```

### Dapp (`dapp/`)

```bash
cd dapp
forge install
forge build
forge test
```

Deployment notes and addresses:

- `docs/deployments.md`

## Project Structure / Directory Guide

Monorepo layout:

- `backend/` — NestJS + Prisma + chess + GOAT
  - `src/service-modules/chess-service/` — chess rules (`chess.js`) + Stockfish engine adapter
  - `src/service-modules/match/` — match orchestration + SSE streaming + on-chain challenge helpers
  - `src/service-modules/goat/` — agent decision loop + plugins (Uniswap v4, ERC20 wallet, Gambit)
- `frontend/` — Next.js app (responsive UI)
  - `app/(marketplace)/...` — marketplace pages (agents, dashboards, match view)
  - `hooks/` — match streaming + trading hooks
  - `lib/contracts/` — Uniswap v4 helpers + ABIs
- `dapp/` — Foundry smart contracts
  - `src/AgentFactory.sol` — creates tokens, pools, and LP positions
  - `src/MatchEngine.sol` — challenges + stake locking + settlement
  - `src/GambitHook.sol` — Uniswap v4 hook for fee routing
- `docs/` — high-signal docs for judges (overview, integrations, deployments, flows)

## Contract Addresses

All deployed addresses (Base Sepolia) are tracked in `docs/deployments.md`.

## HackMoney 2026 — Uniswap v4 Usage (Bounty Notes)

We use **Uniswap v4** across the stack:

- **Frontend**
  - Reads pool price via **StateView** and swaps via **PoolSwapTest**
  - Primary trading hook: `frontend/hooks/useAgentContract.ts`
- **Backend (agent tools)**
  - GOAT tools for swapping/LP actions + Gambit tools that route through the protocol
  - See: `backend/src/service-modules/goat/plugins/uniswap-v4/` and `.../plugins/gambit/`
- **Contracts**
  - `AgentFactory.sol` creates per-agent pools and mints LP positions (user LP + agent LP)
  - `GambitHook.sol` provides Uniswap v4 hook behavior (fee routing)

For exact file pointers, see `docs/integrations.md`.

## HackMoney 2026 — ENS Domain

- **Project ENS**: TODO (e.g. `gambitxyz.eth`)
- **ENS usage in-app**: ENS is used for display only (show ENS name instead of address) on the frontend.

## Future Improvements / Roadmap

- **Protocol**: stronger settlement verification + dispute flow; richer on-chain match metadata
- **Agents**: improved ELO ↔ market dynamics; more playstyles; stronger post-match treasury logic
- **Scaling**: multiple concurrent matches; better engine process management
- **UX**: richer charts, match replay UX, notifications, better onboarding

## HackMoney 2026 Team Info

TODO:

- Name — Role — Contact
- Name — Role — Contact

## Repo Structure (quick)

- `backend/`: NestJS w/ Prisma + GOAT + chess.js + Stockfish
- `frontend/`: Next.js w/ Privy + wagmi + chess UI + Uniswap v4 trading
- `dapp/`: Foundry Solidity contracts (AgentFactory / MatchEngine / Hook)

