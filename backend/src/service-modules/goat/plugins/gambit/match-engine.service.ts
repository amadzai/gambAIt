import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { matchEngineAbi } from './abis/match-engine.abi.js';
import {
  ChallengeParams,
  AcceptChallengeParams,
  DeclineChallengeParams,
  SettleMatchParams,
  CancelMatchParams,
  CancelExpiredChallengeParams,
  GetMatchParams,
  EmptyParams,
} from './parameters.js';
import { Abi } from 'viem';

export class MatchEngineService {
  private contractAddress: `0x${string}`;

  constructor(contractAddress: `0x${string}`) {
    this.contractAddress = contractAddress;
  }

  @Tool({
    description:
      'Challenge another AI agent to a chess match with a staked amount of USDC. Pass agent token addresses (not wallet addresses).',
  })
  async challenge(
    walletClient: EVMWalletClient,
    parameters: ChallengeParams,
  ): Promise<string> {
    const raw = parameters as Record<string, unknown>;
    console.log('[MatchEngine] challenge raw parameters:', JSON.stringify(raw));
    const stakeResolved =
      parameters.stakeAmount ?? raw.stake_amount ?? raw.amount ?? raw.stake;
    const stakeStr =
      stakeResolved != null && stakeResolved !== ''
        ? String(stakeResolved)
        : '';
    if (!stakeStr || stakeStr === 'undefined') {
      throw new Error(
        'challenge tool requires stakeAmount (USDC base units). Use the exact parameter name stakeAmount.',
      );
    }
    console.log(
      `[MatchEngine] challenge called — myAgentToken=${parameters.myAgentToken}, opponentToken=${parameters.opponentToken}, stakeAmount=${stakeStr}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'challenge',
        args: [
          parameters.myAgentToken,
          parameters.opponentToken,
          BigInt(stakeStr),
        ],
      });
      console.log(`[MatchEngine] challenge tx sent — hash=${hash}`);
      return `Challenge created. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] challenge failed: ${msg}`);
      return `Challenge failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Accept a pending chess match challenge. The matching stake is automatically taken from your USDC balance.',
  })
  async acceptChallenge(
    walletClient: EVMWalletClient,
    parameters: AcceptChallengeParams,
  ): Promise<string> {
    console.log(
      `[MatchEngine] acceptChallenge called — matchId=${parameters.matchId}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'acceptChallenge',
        args: [parameters.matchId],
      });
      console.log(`[MatchEngine] acceptChallenge tx sent — hash=${hash}`);
      return `Challenge accepted. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] acceptChallenge failed: ${msg}`);
      return `Accept challenge failed: ${msg}`;
    }
  }

  @Tool({
    description: 'Decline or withdraw a pending chess match challenge',
  })
  async declineChallenge(
    walletClient: EVMWalletClient,
    parameters: DeclineChallengeParams,
  ): Promise<string> {
    console.log(
      `[MatchEngine] declineChallenge called — matchId=${parameters.matchId}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'declineChallenge',
        args: [parameters.matchId],
      });
      console.log(`[MatchEngine] declineChallenge tx sent — hash=${hash}`);
      return `Challenge declined. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] declineChallenge failed: ${msg}`);
      return `Decline challenge failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Settle a completed chess match with the winner token and backend-signed authorization',
  })
  async settleMatch(
    walletClient: EVMWalletClient,
    parameters: SettleMatchParams,
  ): Promise<string> {
    console.log(
      `[MatchEngine] settleMatch called — matchId=${parameters.matchId}, winnerToken=${parameters.winnerToken}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'settleMatch',
        args: [
          parameters.matchId,
          parameters.winnerToken,
          parameters.signature,
        ],
      });
      console.log(`[MatchEngine] settleMatch tx sent — hash=${hash}`);
      return `Match settled. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] settleMatch failed: ${msg}`);
      return `Settle match failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Cancel an active match with backend-signed authorization. Returns stakes to both agents.',
  })
  async cancelMatch(
    walletClient: EVMWalletClient,
    parameters: CancelMatchParams,
  ): Promise<string> {
    console.log(
      `[MatchEngine] cancelMatch called — matchId=${parameters.matchId}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'cancelMatch',
        args: [parameters.matchId, parameters.signature],
      });
      console.log(`[MatchEngine] cancelMatch tx sent — hash=${hash}`);
      return `Match cancelled. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] cancelMatch failed: ${msg}`);
      return `Cancel match failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Cancel a match that has expired past the 24-hour timeout period. Anyone can call this.',
  })
  async cancelExpiredChallenge(
    walletClient: EVMWalletClient,
    parameters: CancelExpiredChallengeParams,
  ): Promise<string> {
    console.log(
      `[MatchEngine] cancelExpiredChallenge called — matchId=${parameters.matchId}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'cancelExpiredChallenge',
        args: [parameters.matchId],
      });
      console.log(
        `[MatchEngine] cancelExpiredChallenge tx sent — hash=${hash}`,
      );
      return `Expired challenge cancelled. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] cancelExpiredChallenge failed: ${msg}`);
      return `Cancel expired challenge failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Get details of a chess match including agents, wallets, stakes, status, and timestamps',
  })
  async getMatch(
    walletClient: EVMWalletClient,
    parameters: GetMatchParams,
  ): Promise<string> {
    console.log(
      `[MatchEngine] getMatch called — matchId=${parameters.matchId}, contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'getMatch',
        args: [parameters.matchId],
      });
      const replacer = (_key: string, value: unknown): unknown =>
        typeof value === 'bigint' ? value.toString() : value;
      const json = JSON.stringify(result.value, replacer);
      console.log(`[MatchEngine] getMatch result: ${json}`);
      return json;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] getMatch failed: ${msg}`);
      return `Get match failed: ${msg}`;
    }
  }

  @Tool({
    description: 'Get all match IDs from the MatchEngine contract',
  })
  async getAllMatches(
    walletClient: EVMWalletClient,
    parameters: EmptyParams,
  ): Promise<string> {
    void parameters;
    console.log(
      `[MatchEngine] getAllMatches called — contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: matchEngineAbi as unknown as Abi,
        functionName: 'getAllMatches',
      });
      const matches = result.value as string[];
      console.log(`[MatchEngine] getAllMatches result: ${matches.length} matches`);
      return `All matches (${matches.length}): ${matches.join(', ')}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MatchEngine] getAllMatches failed: ${msg}`);
      return `Get all matches failed: ${msg}`;
    }
  }
}
