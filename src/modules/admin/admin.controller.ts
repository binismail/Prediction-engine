import { Controller, Post, Param, Body, Get, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Market } from '../../domain/entities/market.entity';
import { Trade } from '../../domain/entities/trade.entity';
import { MarketStatus } from '../../domain/value-objects/market-status';
import { ResolveMarketDto } from './dto/resolve-market.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('markets')
  @ApiOperation({ summary: 'Create a new market manually (Admin)' })
  async createMarket(@Body() dto: any) {
    this.logger.log(`Admin creating market: ${dto.question}`);
    
    // Auto-generate ticker if missing
    const ticker = dto.ticker || `MKT-${Math.floor(Math.random()*10000)}`;

    const market = this.marketRepository.create({
        ticker,
        question: dto.question,
        resolutionCriteria: dto.resolutionCriteria || 'Manual Admin Resolution',
        collateralType: dto.collateralType || 'USDC',
        expiryAt: new Date(dto.expiryAt),
        status: MarketStatus.ACTIVE, // Start Active for demo simplicity, or pending if preferred
        poolYesBalance: parseFloat(dto.initialLiquidity) || 100,
        poolNoBalance: parseFloat(dto.initialLiquidity) || 100,
    });

    return this.marketRepository.save(market);
  }

  @Post('markets/:id/resolve')
  @ApiOperation({ summary: 'Force resolve a market (Admin Override)' })
  async resolveMarket(@Param('id') id: string, @Body() dto: ResolveMarketDto) {
    this.logger.warn(`Admin forcing resolution for market ${id} to ${dto.outcome}`);

    const market = await this.marketRepository.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');

    if (market.status === MarketStatus.SETTLED) {
      throw new BadRequestException('Market is already settled');
    }

    // Emit event to trigger SettlementService
    this.eventEmitter.emit('MarketResolved', {
      marketId: market.id,
      outcome: dto.outcome,
    });

    return { status: 'RESOLVING', message: `Resolution triggered with outcome ${dto.outcome}` };
  }

  @Post('markets/:id/pause')
  @ApiOperation({ summary: 'Emergency pause trading' })
  async pauseMarket(@Param('id') id: string) {
    const market = await this.marketRepository.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');

    market.status = MarketStatus.PAUSED;
    await this.marketRepository.save(market);

    this.logger.warn(`Market ${market.ticker} PAUSED by Admin`);
    return { status: 'PAUSED', marketId: id };
  }

  @Post('markets/:id/resume')
  @ApiOperation({ summary: 'Resume trading for a paused market' })
  async resumeMarket(@Param('id') id: string) {
    const market = await this.marketRepository.findOne({ where: { id } });
    if (!market) throw new NotFoundException('Market not found');

    // Only allow resuming if it was paused
    if (market.status !== MarketStatus.PAUSED) {
        throw new BadRequestException(`Market is in state ${market.status}, cannot resume.`);
    }

    market.status = MarketStatus.ACTIVE;
    await this.marketRepository.save(market);

    this.logger.log(`Market ${market.ticker} RESUMED by Admin`);
    return { status: 'ACTIVE', marketId: id };
  }

  @Get('system/stats')
  @ApiOperation({ summary: 'View total volume and counts' })
  async getSystemStats() {
    const totalMarkets = await this.marketRepository.count();
    const totalTrades = await this.tradeRepository.count();
    
    // Simple mock for total volume (summing all trade amounts)
    const { sum } = await this.tradeRepository
        .createQueryBuilder('trade')
        .select('SUM(trade.amount)', 'sum')
        .getRawOne();

    return {
      markets: totalMarkets,
      trades: totalTrades,
      totalVolumeUSDC: sum || 0,
      feesCollected: 0 // TODO: Implement Fee mechanism
    };
  }
}
