import axios from 'axios';
import type {
  AgentMoveDto,
  AgentMoveResponseDto,
  AgentResponseDto,
  CreateAgentDto,
  UpdateAgentDto,
} from '@/types/agent';
import type {
  ChessGame,
  EngineMovesQuery,
  EngineMovesResponse,
  GameStatusResponse,
  LegalMoveResponse,
  MakeMovePayload,
  MoveResultResponse,
  ValidateMoveResponse,
} from '@/types/chess';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export const apiService = {
  chess: {
    createGame: async (body: {
      whiteAgentId: string;
      blackAgentId: string;
    }): Promise<ChessGame> => {
      const res = await api.post<ChessGame>('/chess/games', body);
      return res.data;
    },

    getGameById: async (gameId: string): Promise<ChessGame> => {
      const res = await api.get<ChessGame>(`/chess/games/${gameId}`);
      return res.data;
    },

    getGameStatus: async (gameId: string): Promise<GameStatusResponse> => {
      const res = await api.get<GameStatusResponse>(`/chess/games/${gameId}/status`);
      return res.data;
    },

    getLegalMoves: async (
      gameId: string,
      square?: string,
    ): Promise<LegalMoveResponse[]> => {
      const res = await api.get<LegalMoveResponse[]>(
        `/chess/games/${gameId}/legal-moves`,
        square ? { params: { square } } : undefined,
      );
      return res.data;
    },

    validateMove: async (
      gameId: string,
      payload: MakeMovePayload,
    ): Promise<ValidateMoveResponse> => {
      const res = await api.post<ValidateMoveResponse>(
        `/chess/games/${gameId}/validate-move`,
        payload,
      );
      return res.data;
    },

    loadPosition: async (
      gameId: string,
      fen: string,
    ): Promise<ChessGame> => {
      const res = await api.post<ChessGame>(
        `/chess/games/${gameId}/load-position`,
        { fen },
      );
      return res.data;
    },

    makeMove: async (
      gameId: string,
      payload: MakeMovePayload,
    ): Promise<MoveResultResponse> => {
      const res = await api.post<MoveResultResponse>(`/chess/games/${gameId}/move`, payload);
      return res.data;
    },

    getCandidateMovesFromStockfish: async (
      gameId: string,
      params?: EngineMovesQuery,
    ): Promise<EngineMovesResponse> => {
      const res = await api.get<EngineMovesResponse>(`/chess/games/${gameId}/engine-moves`, {
        params,
      });
      return res.data;
    },

    resign: async (gameId: string): Promise<ChessGame> => {
      const res = await api.post<ChessGame>(`/chess/games/${gameId}/resign`);
      return res.data;
    },
  },

  agents: {
    create: async (dto: CreateAgentDto): Promise<AgentResponseDto> => {
      const res = await api.post<AgentResponseDto>('/agents', dto);
      return res.data;
    },

    update: async (
      id: string,
      dto: UpdateAgentDto,
    ): Promise<AgentResponseDto> => {
      const res = await api.put<AgentResponseDto>(`/agents/${id}`, dto);
      return res.data;
    },

    list: async (): Promise<AgentResponseDto[]> => {
      const res = await api.get<AgentResponseDto[]>('/agents');
      return res.data;
    },

    get: async (id: string): Promise<AgentResponseDto> => {
      const res = await api.get<AgentResponseDto>(`/agents/${id}`);
      return res.data;
    },

    move: async (
      id: string,
      dto: AgentMoveDto,
    ): Promise<AgentMoveResponseDto> => {
      const res = await api.post<AgentMoveResponseDto>(`/agents/${id}/move`, dto);
      return res.data;
    },
  },
};

