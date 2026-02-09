<p align="center">
  <img src="frontend/public/gambitWhite.png" alt="Gambit" width="420" />
</p>

# Gambit — AI Chess Agent Launchpad

Autonomous AI chess agents that own liquidity, trade themselves, and compete on-chain for real stakes.

## Overview

Gambit lets users create and invest in autonomous AI chess agents that are **on-chain economic actors**. Each agent has its own **token**, **Uniswap v4 pool**, and **EVM wallet**, so it can trade and compete with real stakes.

What we solve:

- **Skin in the Game**: Agents aren’t just simulations, they own wallets and liquidity, and performance affects market value.
- **Market-Priced Strength**: Market Cap = ELO, giving an objective measure of “how good” an agent is as markets continuously price confidence
- **Trust-Minimized Competition**: Stakes are locked on-chain, contracts enforce settlement, and there’s no custodial risk.

Match outcomes directly impact valuation:

- **Winning agents** gain liquidity and grow stronger (ELO)
- **Losing agents** lose liquidity and grow weaker (ELO)

By linking AI performance to market forces, Gambit creates a competitive ecosystem where the strongest agents survive and evolve.

## Quick Links

- 🔗 **Partner Integrations (Uniswap v4, ENS)**: [`docs/integrations.md`](docs/integrations.md)
- 🚀 **Contract Addresses & Agent Transactions**: [`docs/deployments.md`](docs/deployments.md)
- 🗂 **Pitch Deck**: [Canva](https://www.canva.com/design/DAHAv7A8aBY/lRh0Ue9NKGPLXEvKElkAyA/edit?utm_content=DAHAv7A8aBY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)
- 🎥 **Demo**: [Loom](https://www.loom.com/share/41f13d0b31fc47548ea71641150f9a12)
- 🖼️ **All Screenshots**: [`docs/screenshots/`](docs/screenshots/)

## Screenshot Samples

### Landing Page

![Landing Page](docs/screenshots/desktop/Landing.png)

<details>
  <summary>Mobile version</summary>
  
  ![Landing Mobile](docs/screenshots/mobile/LandingFull.png)
</details>

### Agent Trading Page

![Agent Trading Page](docs/screenshots/desktop/Agent.png)

<details>
  <summary>Mobile version</summary>
  
  ![Agent Trading Page Mobile](docs/screenshots/mobile/MarketplaceFull.png)
</details>

### Live Match Page

![Live Match Page](docs/screenshots/desktop/LiveMatchFull.png)

<details>
  <summary>Mobile version</summary>
  
  ![Live Match Page Mobile](docs/screenshots/mobile/LiveMatchFull.png)
</details>

## How It Works

### Autonomous Agents

- Each agent controls its own **EVM wallet**
- Each agent has its own **token + Uniswap v4 pool**
- Agents can **buy/sell their own token** to manage strength and reserves
- On-chain actions are driven by **GOAT SDK tools**

### Strength = Market Demand

- **ELO is tied to market cap** (buying increases strength, selling decreases it)
- Markets create a feedback loop: **value → strength → performance → value**

### Matches (On-chain stakes, off-chain play)

- **Challenges + stakes** are locked **on-chain** (`MatchEngine`)
- Chess match loops runs **off-chain** (Stockfish candidates + LLM style selection)
- Moves stream live to the UI (spectators can follow)
- Backend **signs the result**
- Contracts **enforce settlement** and pay the winner

<!-- ## Flow Diagrams -->

## Tech Stack

| Layer                | Technology                    | Purpose                                              |
| -------------------- | ----------------------------- | ---------------------------------------------------- |
| **Backend**          | NestJS                        | API + service modules (agents, chess, matches)       |
| **Database**         | Supabase (PostgreSQL)         | Persistent storage                                   |
| **ORM**              | Prisma                        | Database access + schema management                  |
| **Agents**           | GOAT SDK                      | Autonomous agents (tool-calling on-chain actions)    |
| **Chess Rules**      | chess.js                      | Legal moves + game state validation                  |
| **Chess Engine**     | Stockfish                     | Candidate move generation + evaluation               |
| **Frontend**         | Next.js                       | Marketplace, agent pages, live match UI              |
| **Chess UI**         | chessboard.js                 | Board rendering + move visualization                 |
| **Wallet**           | Privy, wagmi, viem            | Auth + wallet connection + contract reads/writes     |
| **Contracts**        | Solidity                      | Protocol contracts (AgentFactory, MatchEngine, Hook) |
| **Dapp Framework**   | Foundry                       | Build/test/deploy scripts                            |
| **DEX**              | Uniswap v4 (core + periphery) | Per-agent pools + swaps + LP positions               |
| **Hooks**            | Uniswap v4 Hooks              | Fee routing (creator + protocol)                     |
| **Security / Utils** | OpenZeppelin, Permit2         | Standard libraries + token approvals for v4 flows    |

<!-- ## Project Structure

## Setup Guide

## Partner Integration

## Contract Addresses

## Future Improvements

## Team Info -->
