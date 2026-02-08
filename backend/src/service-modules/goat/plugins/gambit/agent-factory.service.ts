import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { agentFactoryAbi } from './abis/agent-factory.abi.js';
import { poolSwapTestAbi } from './abis/pool-swap-test.abi.js';
import {
  CreateAgentParams,
  GetMarketCapParams,
  GetAgentInfoParams,
  BuyOwnTokenParams,
  EmptyParams,
} from './parameters.js';
import { Abi } from 'viem';
import { HOOKLESS_HOOKS } from '../../constants/contracts.js';

/** Pool configuration constants (must match AgentFactory.sol / frontend). */
const POOL_FEE = 3000;
const TICK_SPACING = 60;
/** Minimum sqrt price for zeroForOne swaps (MIN_SQRT_PRICE + 1). */
const MIN_SQRT_PRICE_LIMIT = BigInt('4295128740');
/** Maximum sqrt price for oneForZero swaps (MAX_SQRT_PRICE - 1). */
const MAX_SQRT_PRICE_LIMIT = BigInt(
  '1461446703485210103287273052203988822378723970341',
);

export class AgentFactoryService {
  private contractAddress: `0x${string}`;
  private usdcAddress: `0x${string}`;
  private poolSwapTestAddress: `0x${string}`;

  constructor(
    contractAddress: `0x${string}`,
    usdcAddress: `0x${string}`,
    poolSwapTestAddress: `0x${string}`,
  ) {
    this.contractAddress = contractAddress;
    this.usdcAddress = usdcAddress;
    this.poolSwapTestAddress = poolSwapTestAddress;
  }

  @Tool({
    description:
      'Create a new AI chess agent with a tradeable ERC20 token and Uniswap V4 pool on Base Sepolia',
  })
  async createAgent(
    walletClient: EVMWalletClient,
    parameters: CreateAgentParams,
  ): Promise<string> {
    const usdcAmount =
      parameters.usdcAmount ?? (parameters as any).usdc_amount;
    const agentWallet =
      parameters.agentWallet ?? (parameters as any).agent_wallet;
    console.log(
      `[AgentFactory] createAgent called — name=${parameters.name}, symbol=${parameters.symbol}, usdcAmount=${usdcAmount}, agentWallet=${agentWallet}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'createAgent',
        args: [
          parameters.name,
          parameters.symbol,
          BigInt(String(usdcAmount)),
          agentWallet,
        ],
      });
      console.log(`[AgentFactory] createAgent tx sent — hash=${hash}`);
      return `Agent created. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentFactory] createAgent failed: ${msg}`);
      return `Create agent failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Get the market cap of an agent token in USDC from the AgentFactory contract',
  })
  async getMarketCap(
    walletClient: EVMWalletClient,
    parameters: GetMarketCapParams,
  ): Promise<string> {
    const agentToken =
      parameters.agentToken ?? (parameters as any).agent_token;
    console.log(
      `[AgentFactory] getMarketCap called — agentToken=${agentToken}, contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'getMarketCap',
        args: [agentToken],
      });
      const output = `Market cap: ${String(result.value)} (USDC base units, 6 decimals)`;
      console.log(`[AgentFactory] getMarketCap result: ${output}`);
      return output;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentFactory] getMarketCap failed: ${msg}`);
      return `Get market cap failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Get all agent token addresses created through the AgentFactory',
  })
  async getAllAgents(
    walletClient: EVMWalletClient,
    parameters: EmptyParams,
  ): Promise<string> {
    void parameters;
    console.log(
      `[AgentFactory] getAllAgents called — contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'getAllAgents',
      });
      const agents = result.value as string[];
      console.log(`[AgentFactory] getAllAgents result: ${agents.length} agents`);
      return `All agents (${agents.length}): ${agents.join(', ')}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentFactory] getAllAgents failed: ${msg}`);
      return `Get all agents failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Get detailed info about an agent including name, symbol, creator, wallet, and position IDs',
  })
  async getAgentInfo(
    walletClient: EVMWalletClient,
    parameters: GetAgentInfoParams,
  ): Promise<string> {
    const tokenAddress =
      parameters.tokenAddress ?? (parameters as any).token_address;
    console.log(
      `[AgentFactory] getAgentInfo called — tokenAddress=${tokenAddress}, contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'getAgentInfo',
        args: [tokenAddress],
      });
      const replacer = (_key: string, value: unknown): unknown =>
        typeof value === 'bigint' ? value.toString() : value;
      const json = JSON.stringify(result.value, replacer);
      console.log(`[AgentFactory] getAgentInfo result: ${json}`);
      return json;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentFactory] getAgentInfo failed: ${msg}`);
      return `Get agent info failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Buy own agent token using USDC war chest via Uniswap V4 swap to increase market cap and ELO. USDC must be approved for the PoolSwapTest contract before calling this.',
  })
  async buyOwnToken(
    walletClient: EVMWalletClient,
    parameters: BuyOwnTokenParams,
  ): Promise<string> {
    // GOAT SDK may present params as snake_case to the LLM, so handle both
    const agentToken =
      parameters.agentToken ?? (parameters as any).agent_token;
    const usdcAmount =
      parameters.usdcAmount ?? (parameters as any).usdc_amount;
    const rawAmount = BigInt(String(usdcAmount));

    console.log(
      `[AgentFactory] buyOwnToken called — agentToken=${agentToken}, usdcAmount=${usdcAmount}, poolSwapTest=${this.poolSwapTestAddress}`,
    );

    try {
      // Build the PoolKey — currencies must be sorted by address
      const usdcLower = this.usdcAddress.toLowerCase();
      const tokenLower = (agentToken as string).toLowerCase();
      const [currency0, currency1] =
        usdcLower < tokenLower
          ? [this.usdcAddress, agentToken as `0x${string}`]
          : [agentToken as `0x${string}`, this.usdcAddress];

      // Buying = USDC → AgentToken
      // If USDC is currency0: zeroForOne = true (swap 0 → 1)
      // If USDC is currency1: zeroForOne = false (swap 1 → 0)
      const zeroForOne = usdcLower < tokenLower;

      const { hash } = await walletClient.sendTransaction({
        to: this.poolSwapTestAddress,
        abi: poolSwapTestAbi as Abi,
        functionName: 'swap',
        args: [
          // PoolKey
          {
            currency0,
            currency1,
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: HOOKLESS_HOOKS,
          },
          // SwapParams — negative amountSpecified = exact input
          {
            zeroForOne,
            amountSpecified: -rawAmount,
            sqrtPriceLimitX96: zeroForOne
              ? MIN_SQRT_PRICE_LIMIT
              : MAX_SQRT_PRICE_LIMIT,
          },
          // TestSettings
          { takeClaims: false, settleUsingBurn: false },
          // hookData
          '0x',
        ],
      });
      console.log(`[AgentFactory] buyOwnToken swap tx sent — hash=${hash}`);
      return `Token purchased via Uniswap V4 swap. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentFactory] buyOwnToken failed: ${msg}`);
      return `Buy own token failed: ${msg}`;
    }
  }
}
