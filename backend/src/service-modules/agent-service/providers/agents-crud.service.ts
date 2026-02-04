import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Agent, Playstyle } from '../../../../generated/prisma/client.js';

export type CreateAgentInput = {
  name: string;
  playstyle: Playstyle;
  opening?: string | null;
  personality?: string | null;
  profileImage?: string | null;
  elo?: number;
};

@Injectable()
export class AgentsCrudService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(agentId: string, input: CreateAgentInput): Promise<Agent> {
    return this.prisma.agent.upsert({
      where: { id: agentId },
      create: {
        id: agentId,
        name: input.name,
        playstyle: input.playstyle,
        opening: input.opening,
        personality: input.personality,
        profileImage: input.profileImage,
        elo: input.elo,
      },
      update: {
        name: input.name,
        playstyle: input.playstyle,
        opening: input.opening,
        personality: input.personality,
        profileImage: input.profileImage,
        elo: input.elo,
      },
    });
  }

  async get(agentId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }
    return agent;
  }

  async list(): Promise<Agent[]> {
    return this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
