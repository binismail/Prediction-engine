import { Module } from '@nestjs/common';
import { DiscoveryAgent } from './discovery/discovery.agent';
import { LiquidityAgent } from './liquidity/liquidity.agent';
import { ResolutionAgent } from './resolution/resolution.agent';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from '../domain/entities/market.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Market])],
  providers: [DiscoveryAgent, LiquidityAgent, ResolutionAgent],
  exports: [DiscoveryAgent, LiquidityAgent, ResolutionAgent],
})
export class AgentsModule {}
