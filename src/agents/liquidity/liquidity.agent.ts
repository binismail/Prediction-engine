import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Market } from '../../domain/entities/market.entity';
import { Repository } from 'typeorm';
import { MarketStatus } from '../../domain/value-objects/market-status';

@Injectable()
export class LiquidityAgent implements OnModuleInit {
  private readonly logger = new Logger(LiquidityAgent.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
  ) {}

  onModuleInit() {
    this.logger.log('✅ Liquidity Agent Initialized! Starting Market Maker bot...');
    setInterval(() => {
      this.maintainLiquidity();
    }, 15000); // Check every 15 seconds
  }

  async maintainLiquidity() {
    this.logger.log('💧 Liquidity Agent: Checking for thin markets...');

    const activeMarkets = await this.marketRepository.find({
      where: { status: MarketStatus.ACTIVE }
    });

    for (const market of activeMarkets) {
      const totalLiq = Number(market.poolYesBalance) + Number(market.poolNoBalance);
      
      // Threshold: If pool has less than 500 units, it's "thin" and prone to slippage.
      if (totalLiq < 500) {
        this.logger.log(`⚠️ Market ${market.ticker} is thin (Liquidity: ${totalLiq}). Injecting capital...`);
        
        // Strategy: "Deepening" - Add liquidity to both sides to reduce slippage
        // +50 to YES, +50 to NO
        // This keeps the PRICE the same (ratio/probability unchanged) but increases DEPTH.
        market.poolYesBalance = Number(market.poolYesBalance) + 50;
        market.poolNoBalance = Number(market.poolNoBalance) + 50;

        await this.marketRepository.save(market);
        this.logger.log(`🐳 Injected +50/+50 liquidity into ${market.ticker}`);
      }
    }
  }
}

