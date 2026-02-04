import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Chess, Square } from 'chess.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChessRulesService } from '../../chess-service/providers/chess-rules.service.js';
import { EngineMoveResponse } from '../../chess-service/interfaces/chess-engine.interface.js';
import {
  MakeMoveDto,
  MoveResult,
} from '../../chess-service/interfaces/chess-rules.interface.js';
import { OpenRouterService } from './openrouter.service.js';
import { Agent, Playstyle } from '../../../../generated/prisma/client.js';

const DEFAULT_MULTI_PV = 10;
const UCI_REGEX = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export type AgentMoveRequest = {
  gameId: string;
  multiPv?: number;
  movetimeMs?: number;
  depth?: number;
};

export type AgentMoveResponse = {
  agent: Agent;
  engine: EngineMoveResponse;
  selectedUci: string;
  appliedMove: MakeMoveDto;
  moveResult: MoveResult;
  fallbackUsed: boolean;
};

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chessRulesService: ChessRulesService,
    private readonly openRouterService: OpenRouterService,
  ) {}

  async makeAgentMove(
    agentId: string,
    req: AgentMoveRequest,
  ): Promise<AgentMoveResponse> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent)
      throw new NotFoundException(`Agent with ID ${agentId} not found`);

    const engine = await this.chessRulesService.requestMove({
      gameId: req.gameId,
      elo: agent.elo,
      multiPv: req.multiPv ?? DEFAULT_MULTI_PV,
      movetimeMs: req.movetimeMs,
      depth: req.depth,
    });

    if (!engine.candidates || engine.candidates.length === 0) {
      throw new BadRequestException('Engine returned no candidate moves');
    }

    const preferredOpening = this.normalizePreferredOpening(agent.opening);
    const openingMatch =
      preferredOpening &&
      engine.candidates.find((c) => c.uci.toLowerCase() === preferredOpening);

    let selectedUci: string | null = null;
    let fallbackUsed = false;

    if (openingMatch) {
      selectedUci = openingMatch.uci;
      this.logger.log(`Opening match selected uci=${selectedUci}`);
    } else {
      selectedUci = await this.chooseCandidateWithLlm(agent, engine);
      const allowed = new Set(engine.candidates.map((c) => c.uci));
      if (!selectedUci || !allowed.has(selectedUci)) {
        fallbackUsed = true;
        selectedUci = engine.candidates[0].uci;
        this.logger.warn(
          `LLM selection invalid; falling back to top candidate uci=${selectedUci}`,
        );
      }
    }

    const appliedMove = this.uciToMoveDto(selectedUci);
    const moveResult = await this.chessRulesService.makeMove(
      req.gameId,
      appliedMove,
    );

    return {
      agent,
      engine,
      selectedUci,
      appliedMove,
      moveResult,
      fallbackUsed,
    };
  }

  private normalizePreferredOpening(opening?: string | null): string | null {
    if (!opening) return null;
    const trimmed = opening.trim().toLowerCase();
    if (trimmed === '') return null;
    // Only auto-match openings that look like UCI (e2e4 / e7e8q).
    return UCI_REGEX.test(trimmed) ? trimmed : null;
  }

  private uciToMoveDto(uci: string): MakeMoveDto {
    const move = uci.trim().toLowerCase();
    if (!UCI_REGEX.test(move)) {
      throw new BadRequestException(`Invalid UCI move: "${uci}"`);
    }
    const from = move.slice(0, 2);
    const to = move.slice(2, 4);
    const promotion =
      move.length === 5 ? (move[4] as 'q' | 'r' | 'b' | 'n') : undefined;
    return { from, to, promotion };
  }

  private async chooseCandidateWithLlm(
    agent: Agent,
    engine: EngineMoveResponse,
  ): Promise<string | null> {
    const enriched = engine.candidates.map((c, idx) => {
      const meta = this.enrichCandidate(engine.fen, c.uci);
      return {
        i: idx + 1,
        uci: c.uci,
        san: meta?.san ?? null,
        isCapture: meta?.isCapture ?? null,
        givesCheck: meta?.givesCheck ?? null,
        scoreCp: c.scoreCp ?? null,
        mate: c.mate ?? null,
      };
    });

    const playstyleGuidance = this.playstyleGuidance(agent.playstyle);
    const openingHint =
      agent.opening && agent.opening.trim() !== ''
        ? `Preferred opening: "${agent.opening.trim()}". If any candidate aligns with this, prefer it (but do not choose a move not in the candidate list).`
        : 'No preferred opening.';
    // const personalityHint =
    //   agent.personality && agent.personality.trim() !== ''
    //     ? `Personality: "${agent.personality.trim()}".`
    //     : 'No personality.';

    const prompt = [
      `You are a chess agent. Choose exactly ONE move from the provided candidates.`,
      `Playstyle: ${agent.playstyle}. ${playstyleGuidance}`,
      openingHint,
      // personalityHint,
      `Return ONLY valid JSON like: {"uci":"e2e4"}`,
      `Candidates (choose one of these exact uci strings):`,
      JSON.stringify(enriched),
    ].join('\n');

    const content = await this.openRouterService.createChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You must output only JSON. Do not include code fences or extra text.',
        },
        { role: 'user', content: prompt },
      ],
      maxTokens: 60,
      temperature: 0.2,
      timeoutMs: 12_000,
    });

    const parsed = this.parseJsonObject<{ uci?: string }>(content);
    const uci = parsed?.uci?.trim();
    return uci && UCI_REGEX.test(uci.toLowerCase()) ? uci.toLowerCase() : null;
  }

  private playstyleGuidance(playstyle: Playstyle): string {
    switch (playstyle) {
      case Playstyle.AGGRESSIVE:
        return 'Prefer tactical pressure, captures, checks, and forcing lines when reasonable.';
      case Playstyle.DEFENSIVE:
        return 'Prefer safe, solid moves that improve king safety and reduce risk.';
      case Playstyle.POSITIONAL:
        return 'Prefer improving piece placement, pawn structure, and long-term advantages; avoid unnecessary tactics.';
      default:
        return 'Choose a sensible move.';
    }
  }

  private enrichCandidate(
    fen: string,
    uci: string,
  ): { san: string; isCapture: boolean; givesCheck: boolean } | null {
    try {
      const chess = new Chess(fen);
      const dto = this.uciToMoveDto(uci);
      const move = chess.move({
        from: dto.from as Square,
        to: dto.to as Square,
        promotion: dto.promotion,
      });
      if (!move) return null;
      const givesCheck = chess.isCheck();
      const isCapture =
        Boolean(move.captured) ||
        move.flags.includes('c') ||
        move.flags.includes('e');
      return { san: move.san, isCapture, givesCheck };
    } catch {
      return null;
    }
  }

  private parseJsonObject<T>(text: string): T | null {
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) return null;
      const slice = trimmed.slice(start, end + 1);
      try {
        return JSON.parse(slice) as T;
      } catch {
        return null;
      }
    }
  }
}
