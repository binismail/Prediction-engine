import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Market } from '../../domain/entities/market.entity';
import { MarketStatus } from '../../domain/value-objects/market-status';

@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
  ) {}

  @OnEvent('MarketCreated')
  async handleMarketCreated(payload: any) {
    this.logger.log(`Creating market read-model for: ${payload.ticker}`);
    
    // In strict CQRS, we might just update the read model here. 
    // Since we appended the event first in the Controller/Service, 
    // we can either trust the DB is updated there or rely purely on this event.
    // For this architecture, let's assume the Command handler wrote the event,
    // and this listener updates the "Read Model" (the Market Entity tables).
    
    // Check if duplicate processing
    const existing = await this.marketRepository.findOne({ where: { ticker: payload.ticker } });
    if (existing) return;

    const market = this.marketRepository.create({
      id: payload.marketId,
      ticker: payload.ticker,
      question: payload.question,
      resolutionCriteria: payload.resolutionCriteria,
      expiryAt: payload.expiryAt,
      collateralType: payload.collateralType,
      status: MarketStatus.PENDING,
    });

    await this.marketRepository.save(market);
  }

  @OnEvent('MarketLiquidityAdded')
  async handleLiquidityAdded(payload: any) {
    // If this was the first liquidity, we might auto-transition to ACTIVE
    // For now, simpler logic:
    await this.marketRepository.update(payload.marketId, { status: MarketStatus.ACTIVE });
  }
}
