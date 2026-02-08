import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MatchService } from './match.service.js';

/**
 * Periodically triggers a challenge between two eligible agents.
 *
 * Frequency is controlled by the `MATCH_FREQUENCY` env var (seconds).
 * Stake amount defaults to `DEFAULT_STAKE_AMOUNT` env var (human-readable USDC).
 *
 * Agent selection priority:
 *  1. Agents with the required on-chain fields (walletAddress, encryptedPrivateKey, tokenAddress).
 *  2. Not currently involved in a PENDING or ACTIVE match.
 *  3. Sorted by most recent ChessGame (oldest first — agents who haven't played recently go first).
 *  4. Agents who have never played come before those who have.
 *  5. Ties are broken randomly.
 */
@Injectable()
export class MatchSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(MatchSchedulerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly matchService: MatchService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const frequencySeconds = parseInt(
      process.env.MATCH_FREQUENCY ?? '3600',
      10,
    );
    const intervalMs = frequencySeconds * 1000;

    this.logger.log(
      `Auto-match scheduler initialised — frequency: every ${frequencySeconds}s`,
    );

    const interval = setInterval(() => {
      this.triggerAutoMatch().catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Auto-match cron error: ${msg}`);
      });
    }, intervalMs);

    this.schedulerRegistry.addInterval('auto-match', interval);
  }

  /**
   * Core cron logic: pick two eligible agents and call challenge().
   */
  async triggerAutoMatch(): Promise<void> {
    this.logger.log('Auto-match cron fired — looking for eligible agents…');

    // 1. Guard: only 1 live match at a time
    if (this.matchService.hasActiveMatch()) {
      this.logger.log('Skipping — there is already an active match stream.');
      return;
    }

    // Also check DB for PENDING / ACTIVE on-chain matches
    const pendingOrActive = await this.prisma.match.count({
      where: { status: { in: ['PENDING', 'ACTIVE'] } },
    });
    if (pendingOrActive > 0) {
      this.logger.log(
        `Skipping — ${pendingOrActive} PENDING/ACTIVE match(es) in DB.`,
      );
      return;
    }

    // 2. Find eligible agents (must have wallet + token on-chain fields)
    const eligible = await this.prisma.agent.findMany({
      where: {
        walletAddress: { not: null },
        encryptedPrivateKey: { not: null },
        tokenAddress: { not: null },
      },
      select: {
        id: true,
        name: true,
        whiteGames: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        blackGames: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    if (eligible.length < 2) {
      this.logger.log(
        `Skipping — only ${eligible.length} eligible agent(s) (need at least 2).`,
      );
      return;
    }

    // 3. Derive lastPlayedAt from the most recent ChessGame per agent
    const agentsWithLastPlayed = eligible.map((agent) => {
      const lastWhite = agent.whiteGames[0]?.createdAt ?? null;
      const lastBlack = agent.blackGames[0]?.createdAt ?? null;

      let lastPlayedAt: Date | null = null;
      if (lastWhite && lastBlack) {
        lastPlayedAt = lastWhite > lastBlack ? lastWhite : lastBlack;
      } else {
        lastPlayedAt = lastWhite ?? lastBlack;
      }

      return { id: agent.id, name: agent.name, lastPlayedAt };
    });

    // 4. Sort: never-played first (null), then oldest lastPlayedAt, ties randomised
    agentsWithLastPlayed.sort((a, b) => {
      if (a.lastPlayedAt === null && b.lastPlayedAt === null)
        return Math.random() - 0.5;
      if (a.lastPlayedAt === null) return -1;
      if (b.lastPlayedAt === null) return 1;
      const diff = a.lastPlayedAt.getTime() - b.lastPlayedAt.getTime();
      return diff !== 0 ? diff : Math.random() - 0.5;
    });

    const [challenger, opponent] = agentsWithLastPlayed;

    const stakeAmount = process.env.DEFAULT_STAKE_AMOUNT ?? '1';

    this.logger.log(
      `Auto-match: challenging ${challenger.name} (${challenger.id}) vs ${opponent.name} (${opponent.id}) — stake ${stakeAmount} USDC`,
    );

    // 5. Fire the challenge
    const result = await this.matchService.challenge({
      challengerAgentId: challenger.id,
      opponentAgentId: opponent.id,
      stakeAmount,
    });

    this.logger.log(
      `Auto-match challenge created — matchId=${result.matchId} onChainMatchId=${result.onChainMatchId}`,
    );
  }
}
