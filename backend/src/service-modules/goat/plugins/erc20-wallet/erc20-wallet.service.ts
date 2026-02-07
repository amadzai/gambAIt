import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { parseAbi } from 'viem';
import {
  GetMyTokenBalanceParams,
  TransferTokenParams,
  EmptyParams,
} from './parameters.js';

/** Minimal ERC-20 ABI used for balance / transfer calls. */
const erc20Abi = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function transfer(address to, uint256 amount) external returns (bool)',
]);

export class Erc20WalletService {
  /** USDC contract address on the current chain. */
  private usdcAddress: `0x${string}`;

  constructor(usdcAddress: `0x${string}`) {
    this.usdcAddress = usdcAddress;
  }

  // ─── Balance helpers (wallet address auto-injected) ─────────────────

  @Tool({
    description:
      'Get the USDC balance of the agent wallet on Base Sepolia. No parameters needed — the wallet address and USDC contract are resolved automatically.',
  })
  async getMyUsdcBalance(
    walletClient: EVMWalletClient,
    _parameters: EmptyParams,
  ): Promise<string> {
    void _parameters;
    const wallet = walletClient.getAddress();

    const rawBalance = await walletClient.read({
      address: this.usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet],
    });

    // USDC uses 6 decimals
    const decimals = 6;
    const formatted = Number(rawBalance.value) / 10 ** decimals;

    return `USDC balance for ${wallet}: ${formatted} USDC (${String(rawBalance.value)} base units, ${decimals} decimals)`;
  }

  @Tool({
    description:
      'Get the balance of any ERC20 token for the agent wallet. Only requires the token contract address — the wallet address is resolved automatically.',
  })
  async getMyTokenBalance(
    walletClient: EVMWalletClient,
    parameters: GetMyTokenBalanceParams,
  ): Promise<string> {
    const wallet = walletClient.getAddress();

    const [rawBalance, rawDecimals, rawSymbol] = await Promise.all([
      walletClient.read({
        address: parameters.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [wallet],
      }),
      walletClient.read({
        address: parameters.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      walletClient.read({
        address: parameters.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
    ]);

    const decimals = Number(rawDecimals.value);
    const symbol = String(rawSymbol.value);
    const formatted = Number(rawBalance.value) / 10 ** decimals;

    return `${symbol} balance for ${wallet}: ${formatted} ${symbol} (${String(rawBalance.value)} base units, ${decimals} decimals)`;
  }

  // ─── Transfer helper (wallet address auto-injected as sender) ──────

  @Tool({
    description:
      'Transfer ERC20 tokens from the agent wallet to another address. The sender is automatically the agent wallet.',
  })
  async transferToken(
    walletClient: EVMWalletClient,
    parameters: TransferTokenParams,
  ): Promise<string> {
    const { hash } = await walletClient.sendTransaction({
      to: parameters.tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      args: [parameters.to, BigInt(parameters.amount)],
    });
    return `Transfer sent. Transaction hash: ${hash}`;
  }
}
