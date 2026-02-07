import type {
  Color,
  GameStatus,
  Winner,
} from '../../../../generated/prisma/client.js';

/**
 * Input for starting a match between two agents.
 */
export interface MatchStartRequest {
  /** White-side agent ID. */
  whiteAgentId: string;
  /** Black-side agent ID. */
  blackAgentId: string;
  /** Number of Stockfish candidate moves (MultiPV). Default 10. */
  multiPv?: number;
  /** Stockfish analysis time in milliseconds. Default 200. */
  movetimeMs?: number;
  /** Delay between moves in milliseconds (for frontend animation pacing). Default 2000. */
  delayMs?: number;
}

/**
 * Payload pushed via SSE after each move in a match.
 */
export interface MatchMoveEvent {
  /** Chess game ID. */
  gameId: string;
  /** 1-based move counter. */
  moveNumber: number;
  /** FEN after the move. */
  fen: string;
  /** PGN after the move (movetext only, no headers). */
  pgn: string;
  /** SAN notation of the move (e.g. Nf3). */
  san: string;
  /** UCI notation of the move (e.g. g1f3). */
  selectedUci: string;
  /** Whose turn it is *after* the move. */
  turn: Color;
  /** Game status after the move. */
  status: GameStatus;
  /** Winner (set on terminal states). */
  winner?: Winner | null;
  /** Agent that made this move. */
  agentId: string;
  /** Display name of the agent that made this move. */
  agentName: string;
  /** True when the LLM output was invalid and Stockfish top-candidate was used. */
  fallbackUsed: boolean;
}
