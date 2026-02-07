import type { EngineMovesResponse, MoveResultResponse } from "./chess";

export type Playstyle = "Aggressive" | "Defensive" | "Balanced" | "Chaotic" | "Positional";

/**
 * Playstyle enum for create-agent / API. Matches backend Prisma/schema: AGGRESSIVE | DEFENSIVE | POSITIONAL.
 */
export type CreateAgentPlaystyle = "AGGRESSIVE" | "DEFENSIVE" | "POSITIONAL";

export type FirstMove = "e4" | "d4" | "c4" | "Nf3" | "g3" | "b3" | "f4";

export interface ChessAgent {
  id: string;
  name: string;
  personality: string;
  playstyle: Playstyle;
  firstMove: FirstMove;
  marketCap: number; // equals ELO
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  owner: string; // wallet address
  createdAt: Date;
}

// ─── API request/response types (match backend AgentsController DTOs) ───

/** POST /agents — create agent body */
export interface CreateAgentDto {
  name: string;
  playstyle: CreateAgentPlaystyle;
  opening?: string;
  personality?: string;
  profileImage?: string;
  elo?: number; // 600–3000, default 1000
}

/** PUT /agents/:id — update agent body (all optional) */
export interface UpdateAgentDto {
  name?: string;
  playstyle?: CreateAgentPlaystyle;
  opening?: string;
  personality?: string;
  profileImage?: string;
  elo?: number; // 600–3000
}

/** POST /agents/:id/move — make move body */
export interface AgentMoveDto {
  gameId: string;
  multiPv?: number; // 1–500
  movetimeMs?: number; // 50–60000
  depth?: number; // 1–50
}

/** GET /agents, GET /agents/:id, POST /agents, PUT /agents/:id — agent response shape */
export interface AgentResponseDto {
  id: string;
  name: string;
  playstyle: CreateAgentPlaystyle;
  opening?: string | null;
  personality?: string | null;
  profileImage?: string | null;
  elo: number;
  createdAt: string; // ISO from JSON
  updatedAt: string; // ISO from JSON
}

/** Applied move in agent move response */
export interface AppliedMoveDto {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
}

/** POST /agents/:id/move — response */
export interface AgentMoveResponseDto {
  agent: AgentResponseDto;
  engine: EngineMovesResponse;
  selectedUci: string;
  appliedMove: AppliedMoveDto;
  moveResult: MoveResultResponse;
  fallbackUsed: boolean;
}
