import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { agentFactoryAbi } from './abis/agent-factory.abi.js';
import {
  CreateAgentParams,
  GetMarketCapParams,
  GetAgentInfoParams,
  BuyOwnTokenParams,
  EmptyParams,
} from './parameters.js';
import { Abi } from 'viem';

export class AgentFactoryService {
  private contractAddress: `0x${string}`;

  constructor(contractAddress: `0x${string}`) {
    this.contractAddress = contractAddress;
  }

  @Tool({
    description:
      'Create a new AI chess agent with a tradeable ERC20 token and Uniswap V4 pool on Base Sepolia',
  })
  async createAgent(
    walletClient: EVMWalletClient,
    parameters: CreateAgentParams,
  ): Promise<string> {
    console.log(
      `[AgentFactory] createAgent called — name=${parameters.name}, symbol=${parameters.symbol}, usdcAmount=${parameters.usdcAmount}, agentWallet=${parameters.agentWallet}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'createAgent',
        args: [
          parameters.name,
          parameters.symbol,
          BigInt(String(parameters.usdcAmount)),
          parameters.agentWallet,
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
    console.log(
      `[AgentFactory] getMarketCap called — agentToken=${parameters.agentToken}, contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'getMarketCap',
        args: [parameters.agentToken],
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
    console.log(
      `[AgentFactory] getAgentInfo called — tokenAddress=${parameters.tokenAddress}, contract=${this.contractAddress}`,
    );
    try {
      const result = await walletClient.read({
        address: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'getAgentInfo',
        args: [parameters.tokenAddress],
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
      'Buy own agent token using USDC war chest to increase market cap and ELO',
  })
  async buyOwnToken(
    walletClient: EVMWalletClient,
    parameters: BuyOwnTokenParams,
  ): Promise<string> {
    console.log(
      `[AgentFactory] buyOwnToken called — agentToken=${parameters.agentToken}, usdcAmount=${parameters.usdcAmount}, contract=${this.contractAddress}`,
    );
    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.contractAddress,
        abi: agentFactoryAbi as Abi,
        functionName: 'buyOwnToken',
        args: [parameters.agentToken, BigInt(String(parameters.usdcAmount))],
      });
      console.log(`[AgentFactory] buyOwnToken tx sent — hash=${hash}`);
      return `Token purchased. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentFactory] buyOwnToken failed: ${msg}`);
      return `Buy own token failed: ${msg}`;
    }
  }
}
