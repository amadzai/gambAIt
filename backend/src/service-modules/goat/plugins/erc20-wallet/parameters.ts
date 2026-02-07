import { createToolParameters } from '@goat-sdk/core';
import { z } from 'zod/v3';

// Type assertion helper: zod/v3 is runtime-compatible with goat-sdk's zod expectations
// but TypeScript sees them as different types since the project uses zod@4.
const toolParams = createToolParameters as (schema: any) => any;

/**
 * Get the balance of a specific ERC20 token for the agent's own wallet.
 * Only needs the token contract address — wallet address is auto-injected.
 */
export class GetMyTokenBalanceParams extends toolParams(
  z.object({
    tokenAddress: z
      .string()
      .describe('The ERC20 token contract address to check the balance of'),
  }),
) {}

/**
 * Transfer ERC20 tokens from the agent's own wallet to another address.
 */
export class TransferTokenParams extends toolParams(
  z.object({
    tokenAddress: z
      .string()
      .describe('The ERC20 token contract address to transfer'),
    to: z.string().describe('The recipient address'),
    amount: z
      .string()
      .describe('The amount of tokens to transfer in base units'),
  }),
) {}

/**
 * No parameters needed — USDC address and wallet address are both auto-injected.
 */
export class EmptyParams extends toolParams(z.object({})) {}
