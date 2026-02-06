import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { CreateMarketDto } from './dto/create-market.dto';
import { EventStoreService } from '../event-store/event-store.service';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Market } from '../../domain/entities/market.entity';
import { Trade } from '../../domain/entities/trade.entity';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketStatus } from '../../domain/value-objects/market-status';

@ApiTags('markets')
@Controller('markets')
export class MarketsController {
  private readonly logger = new Logger(MarketsController.name);

  constructor(
    private readonly eventStore: EventStoreService,
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prediction market' })
  @ApiResponse({ status: 201, description: 'The market has been successfully queued for creation.' })
  async createMarket(@Body() dto: CreateMarketDto) {
    const marketId = uuidv4();
    this.logger.log(`Received command to create market: ${dto.ticker} (${marketId})`);

    // 1. Validate constraints (e.g. ticker uniqueness) implementation
    // Ideally this goes into a unified Command Handler, but checking Read Model here is acceptable for MVP
    const existing = await this.marketRepository.findOne({ where: { ticker: dto.ticker } });
    if (existing) {
      // Allow idempotency or throw error
      return { error: 'Market with ticker already exists', id: existing.id };
    }

    // 2. Create Market Entity (Read Model) - Synchronous Projection
    // This must exist BEFORE the event is saved because MarketEvent has a FK to Market.
    const market = this.marketRepository.create({
      id: marketId,
      ticker: dto.ticker,
      question: dto.question,
      resolutionCriteria: dto.resolutionCriteria,
      expiryAt: new Date(dto.expiryAt),
      collateralType: dto.collateralType,
      status: MarketStatus.PENDING,
      // Initialize with phantom liquidity (100 YES / 100 NO) to start price at 0.50
      poolYesBalance: 100,
      poolNoBalance: 100,
    });
    await this.marketRepository.save(market);

    // 3. Append Event
    await this.eventStore.append(marketId, 'MarketCreated', {
      marketId,
      ticker: dto.ticker,
      question: dto.question,
      resolutionCriteria: dto.resolutionCriteria,
      expiryAt: new Date(dto.expiryAt),
      collateralType: dto.collateralType,
    });

    return {
      status: 'ACCEPTED',
      marketId,
      message: 'Market creation queued',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all markets' })
  async listMarkets() {
    return this.marketRepository.find({ order: { createdAt: 'DESC' } });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific market' })
  async getMarket(@Param('id') id: string) {
    return this.marketRepository.findOne({ where: { id }, relations: ['positions', 'trades'] });
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get price history (candles)' })
  async getMarketHistory(@Param('id') id: string) {
    const market = await this.marketRepository.findOne({ where: { id } });
    if (!market) return [];

    const trades = await this.tradeRepository.find({
      where: { marketId: id },
      order: { createdAt: 'ASC' },
      select: ['createdAt', 'priceAtExecution', 'side']
    });
    
    // Genesis Point (Market Creation @ 0.50)
    const history = [{
      time: market.createdAt,
      price: 0.50,
      side: 'GENESIS'
    }];

    // Append Trades
    trades.forEach(t => {
      history.push({
        time: t.createdAt,
        price: Number(t.priceAtExecution),
        side: t.side
      });
    });

    return history;
  }
}
