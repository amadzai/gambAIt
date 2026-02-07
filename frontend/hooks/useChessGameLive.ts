"use client";

import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/utils/apiService";
import type { ChessGame, GameStatusResponse } from "@/types/chess";

export interface UseChessGameLiveOptions {
  /** Poll interval in ms. Default 2000. */
  pollIntervalMs?: number;
  /** If true, stop polling when game is over. Default true. */
  stopWhenGameOver?: boolean;
}

export interface UseChessGameLiveResult {
  /** Current game state (from last poll). */
  game: ChessGame | null;
  /** Full status response (game + isCheck, legalMoveCount, etc.). */
  status: GameStatusResponse | null;
  /** Loading on initial fetch. */
  isLoading: boolean;
  /** Error from last request. */
  error: Error | null;
  /** Manually refetch once. */
  refetch: () => Promise<void>;
}

/**
 * Polls the chess game API so the UI can show live board updates.
 * Use on match/arena pages when viewing a game by ID.
 * Stops polling when game is over (or when stopWhenGameOver is false, keeps polling).
 */
export function useChessGameLive(
  gameId: string | null,
  options: UseChessGameLiveOptions = {}
): UseChessGameLiveResult {
  const {
    pollIntervalMs = 2000,
    stopWhenGameOver = true,
  } = options;

  const [game, setGame] = useState<ChessGame | null>(null);
  const [status, setStatus] = useState<GameStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!gameId) {
      setGame(null);
      setStatus(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await apiService.chess.getGameStatus(gameId);
      setStatus(data);
      setGame(data.game);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  // Initial fetch and polling
  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setStatus(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      const data = await apiService.chess.getGameStatus(gameId).catch(() => null);
      if (cancelled || !data) return;
      setStatus(data);
      setGame(data.game);
      if (stopWhenGameOver && data.isGameOver && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    setIsLoading(true);
    fetchStatus().then(() => {
      if (cancelled) return;
      intervalId = setInterval(poll, pollIntervalMs);
    });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameId, pollIntervalMs, stopWhenGameOver, fetchStatus]);

  return {
    game,
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
