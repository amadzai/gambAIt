import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  forwardRef,
} from '@nestjs/common';
import {
  createPublicClient,
  webSocket,
  formatUnits,
  type WatchContractEventReturnType,
  type Log,
} from 'viem';
import { baseSepolia, getContractAddresses } from '../constants/contracts.js';
import { matchEngineAbi } from '../plugins/gambit/abis/match-engine.abi.js';
import { GoatService } from '../goat.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MatchService } from '../../match/providers/match.service.js';

type MatchEngineEventAbi = Extract<
  (typeof matchEngineAbi)[number],
  { type: 'event' }
>;
type MatchEngineLog = Log<bigint, number, false, MatchEngineEventAbi, true>;

/**
 * Listens for MatchEngine on-chain events via WebSocket and drives the
 * challenge → accept → match flow.
 */
@Injectable()
export class MatchEventListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MatchEventListenerService.name);
  private unwatchFns: WatchContractEventReturnType[] = [];

  constructor(
    private readonly goatService: GoatService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MatchService))
    private readonly matchService: MatchService,
  ) {}

  onModuleInit() {
    const wssUrl = process.env.WSS_URL;
    if (!wssUrl) {
      this.logger.warn('WSS_URL not set — skipping on-chain event listener');
      return;
    }

    const matchEngineAddress = getContractAddresses().MATCH_ENGINE;
    if (!matchEngineAddress) {
      this.logger.warn(
        'MATCH_ENGINE_ADDRESS not set — skipping event listener',
      );
      return;
    }

    try {
      const client = createPublicClient({
        chain: baseSepolia,
        transport: webSocket(wssUrl),
      });

      const unwatch = client.watchContractEvent({
        address: matchEngineAddress,
        abi: matchEngineAbi,
        pollingInterval: 10_000,
        onLogs: async (logs: MatchEngineLog[]) => {
          this.logger.log(`[MatchEngine] Received ${logs.length} log(s)`);

          for (const log of logs) {
            this.logger.debug({ eventName: log.eventName, log });

            switch (log.eventName) {
              case 'ChallengeCreated':
                await this.handleChallengeCreated(
                  log as Extract<
                    MatchEngineLog,
                    { eventName: 'ChallengeCreated' }
                  >,
                );
                break;
              case 'ChallengeAccepted':
                await this.handleChallengeAccepted(
                  log as Extract<
                    MatchEngineLog,
                    { eventName: 'ChallengeAccepted' }
                  >,
                );
                break;
              case 'MatchSettled':
                await this.handleMatchSettled(
                  log as Extract<MatchEngineLog, { eventName: 'MatchSettled' }>,
                );
                break;
              case 'MatchCancelled':
                await this.handleMatchCancelled(
                  log as Extract<
                    MatchEngineLog,
                    { eventName: 'MatchCancelled' }
                  >,
                );
                break;
            }
          }
        },
        onError: (error) => {
          this.logger.error(
            `[MatchEngine] Error in contract event watcher: ${error.message}`,
            error,
          );
        },
      });

      this.unwatchFns.push(unwatch);
      this.logger.log(
        `Listening for MatchEngine events on ${matchEngineAddress}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to start event listener: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  onModuleDestroy() {
    for (const unwatch of this.unwatchFns) {
      unwatch();
    }
    this.unwatchFns = [];
    this.logger.log('MatchEngine event listeners stopped');
  }

  private async handleChallengeCreated(
    log: Extract<MatchEngineLog, { eventName: 'ChallengeCreated' }>,
  ): Promise<void> {
    const matchId = String(log.args?.matchId);
    const agent1Token = String(log.args?.agent1Token);
    const agent2Token = String(log.args?.agent2Token);
    const stakeAmount = log.args?.stakeAmount;

    this.logger.log(
      `[ChallengeCreated] matchId=${matchId} agent1=${agent1Token} agent2=${agent2Token} stake=${String(stakeAmount)}`,
    );

    try {
      // Look up or create Match record
      let matchRecord = await this.prisma.match.findUnique({
        where: { onChainMatchId: matchId },
      });

      if (!matchRecord) {
        // External challenge — create the DB record
        const humanStake = stakeAmount ? formatUnits(stakeAmount, 6) : '0';
        matchRecord = await this.prisma.match.create({
          data: {
            onChainMatchId: matchId,
            agent1TokenAddress: agent1Token,
            agent2TokenAddress: agent2Token,
            stakeAmount: humanStake,
            status: 'PENDING',
          },
        });
        this.logger.log(
          `[ChallengeCreated] Created Match record for external challenge: ${matchRecord.id}`,
        );
      }

      // Look up the opponent agent by token address
      const opponentAgent = await this.prisma.agent.findFirst({
        where: { tokenAddress: { equals: agent2Token, mode: 'insensitive' } },
        select: { id: true, name: true },
      });

      if (!opponentAgent) {
        this.logger.warn(
          `[ChallengeCreated] No agent found with tokenAddress=${agent2Token} — cannot auto-accept`,
        );
        return;
      }

      const contracts = getContractAddresses();
      const matchEngineAddress = contracts.MATCH_ENGINE;
      const humanStake = matchRecord.stakeAmount;

      // Prompt the opponent agent to approve USDC and accept the challenge
      this.logger.log(
        `[ChallengeCreated] Prompting agent ${opponentAgent.id} (${opponentAgent.name}) to accept challenge ${matchId}`,
      );

      await this.goatService.executeAgentAction(
        opponentAgent.id,
        `You have been challenged to a chess match.
First, approve ${humanStake} USDC for the MatchEngine contract at ${matchEngineAddress}.
Then, call the tool named "acceptChallenge" with exactly this parameter:
- matchId: "${matchId}"
Do this now.`,
      );

      this.logger.log(
        `[ChallengeCreated] Opponent agent ${opponentAgent.id} prompted to accept challenge ${matchId}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[ChallengeCreated] Error handling event for matchId=${matchId}: ${msg}`,
      );
    }
  }

  private async handleChallengeAccepted(
    log: Extract<MatchEngineLog, { eventName: 'ChallengeAccepted' }>,
  ): Promise<void> {
    const matchId = String(log.args?.matchId);

    this.logger.log(
      `[ChallengeAccepted] matchId=${matchId} agent2Wallet=${String(log.args?.agent2Wallet)}`,
    );

    try {
      // Find the Match record
      const matchRecord = await this.prisma.match.findUnique({
        where: { onChainMatchId: matchId },
      });

      if (!matchRecord) {
        this.logger.warn(
          `[ChallengeAccepted] No Match record found for onChainMatchId=${matchId}`,
        );
        return;
      }

      if (matchRecord.status !== 'PENDING') {
        this.logger.warn(
          `[ChallengeAccepted] Match ${matchId} is not PENDING (status=${matchRecord.status}) — skipping`,
        );
        return;
      }

      // Update Match status to ACTIVE
      await this.prisma.match.update({
        where: { id: matchRecord.id },
        data: { status: 'ACTIVE' },
      });

      // Look up both agents by token address (agent1 = white/challenger, agent2 = black/opponent)
      const [whiteAgent, blackAgent] = await Promise.all([
        this.prisma.agent.findFirst({
          where: {
            tokenAddress: {
              equals: matchRecord.agent1TokenAddress,
              mode: 'insensitive',
            },
          },
          select: { id: true, name: true },
        }),
        this.prisma.agent.findFirst({
          where: {
            tokenAddress: {
              equals: matchRecord.agent2TokenAddress,
              mode: 'insensitive',
            },
          },
          select: { id: true, name: true },
        }),
      ]);

      if (!whiteAgent || !blackAgent) {
        this.logger.error(
          `[ChallengeAccepted] Could not resolve agents for match ${matchId}. ` +
            `white(${matchRecord.agent1TokenAddress})=${whiteAgent?.id ?? 'NOT FOUND'} ` +
            `black(${matchRecord.agent2TokenAddress})=${blackAgent?.id ?? 'NOT FOUND'}`,
        );
        return;
      }

      this.logger.log(
        `[ChallengeAccepted] Starting chess match: white=${whiteAgent.id} (${whiteAgent.name}) vs black=${blackAgent.id} (${blackAgent.name})`,
      );

      // Start the chess match
      const { gameId } = await this.matchService.startMatch({
        whiteAgentId: whiteAgent.id,
        blackAgentId: blackAgent.id,
        onChainMatchId: matchId,
      });

      // Link chess game to Match record
      await this.prisma.match.update({
        where: { id: matchRecord.id },
        data: { chessGameId: gameId },
      });

      this.logger.log(
        `[ChallengeAccepted] Chess match started gameId=${gameId} for on-chain matchId=${matchId}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[ChallengeAccepted] Error handling event for matchId=${matchId}: ${msg}`,
      );
    }
  }

  private async handleMatchSettled(
    log: Extract<MatchEngineLog, { eventName: 'MatchSettled' }>,
  ): Promise<void> {
    this.logger.log(
      `[MatchSettled] matchId=${String(log.args?.matchId)} ` +
        `winnerToken=${String(log.args?.winnerToken)} totalPot=${String(log.args?.totalPot)}`,
    );
  }

  private async handleMatchCancelled(
    log: Extract<MatchEngineLog, { eventName: 'MatchCancelled' }>,
  ): Promise<void> {
    this.logger.log(`[MatchCancelled] matchId=${String(log.args.matchId)}`);
  }
}
