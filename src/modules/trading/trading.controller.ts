import { Controller, Post, Body, Logger, Query } from '@nestjs/common';
import { PlaceTradeDto } from './dto/place-trade.dto';
import { SellTradeDto } from './dto/sell-trade.dto';
import { MatchingService } from '../matching/matching.service';
import { MatchingQueue } from '../matching/matching.queue';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('trading')
@Controller('trading')
export class TradingController {
  private readonly logger = new Logger(TradingController.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly matchingQueue: MatchingQueue,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Place a trade' })
  @ApiQuery({ name: 'mode', required: false, enum: ['sync', 'async'], description: 'Execution mode' })
  @ApiResponse({ status: 201, description: 'Trade executed successfully' })
  async placeTrade(@Body() dto: PlaceTradeDto, @Query('mode') mode?: string) {
    this.logger.log(`Received trade request: User ${dto.userId} -> ${dto.side} ${dto.amount} on ${dto.marketId} (Mode: ${mode || 'sync'})`);
    
    // In a real app, we would validating signatures or auth tokens here.

    if (mode === 'async') {
      await this.matchingQueue.addTrade(dto);
      return { status: 'QUEUED', message: 'Trade queued for background processing' };
    }
    
    const result = await this.matchingService.executeTrade(
      dto.userId,
      dto.marketId,
      dto.side,
      dto.amount,
    );

    return result;
  }

  @Post('sell')
  @ApiOperation({ summary: 'Sell (Burn) shares for USDC' })
  @ApiResponse({ status: 201, description: 'Shares sold successfully' })
  async sellPosition(@Body() dto: SellTradeDto) {
    return this.matchingService.executeSell(
      dto.userId,
      dto.marketId,
      dto.side,
      dto.shares,
    );
  }
}
