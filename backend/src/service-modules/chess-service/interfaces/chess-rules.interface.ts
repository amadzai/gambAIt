import { Move } from 'chess.js';
import { ChessGame } from '../../../../generated/prisma/client.js';

/**
 * Input for making a move in a game (source square, target square, optional promotion).
 */
export interface MakeMove {
  /** Source square in algebraic notation (e.g. e2). */
  from: string;
  /** Target square in algebraic notation (e.g. e4). */
  to: string;
  /** Promotion piece when moving a pawn to the last rank (q, r, b, n). */
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/**
 * Result of executing a move: updated game, move details, and game-over flags.
 */
export interface MoveResult {
  /** Whether the move was applied successfully. */
  success: boolean;
  /** Updated game record from the database. */
  game: ChessGame;
  /** The move that was made (from chess.js). */
  move?: Move;
  /** Whether the opponent is in check. */
  isCheck: boolean;
  /** Whether the game ended in checkmate. */
  isCheckmate: boolean;
  /** Whether the game ended in stalemate. */
  isStalemate: boolean;
  /** Whether the game ended in a draw. */
  isDraw: boolean;
  /** Whether the game is over (checkmate, stalemate, draw, or resigned). */
  isGameOver: boolean;
}
