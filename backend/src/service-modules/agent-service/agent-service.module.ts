import { Module } from '@nestjs/common';
import { ChessServiceModule } from '../chess-service/chess-service.module.js';
import { OpenRouterService } from './providers/openrouter.service.js';
import { AgentService } from './providers/agent.service.js';
import { AgentsCrudService } from './providers/agents-crud.service.js';

@Module({
  imports: [ChessServiceModule],
  providers: [OpenRouterService, AgentService, AgentsCrudService],
  exports: [OpenRouterService, AgentService, AgentsCrudService],
})
export class AgentServiceModule {}
