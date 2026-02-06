import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { Interval } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Market } from '../../domain/entities/market.entity';
import { Repository, LessThan } from 'typeorm';
import { MarketStatus } from '../../domain/value-objects/market-status';
import axios from 'axios';

@Injectable()
export class ResolutionAgent implements OnModuleInit {
  private readonly logger = new Logger(ResolutionAgent.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  onModuleInit() {
    this.logger.log('✅ Resolution Agent Initialized! Starting manual loop...');
    // Start manual interval to bypass potential decorator issues
    setInterval(() => {
      this.checkLockedMarkets();
    }, 10000);
  }

  // @Interval(10000) removed to avoid double execution
  async checkLockedMarkets() {
    try {
      this.logger.log('🕵️‍♀️ Resolution Agent: Scanning for markets to resolve...');

      // 1. Find markets that are ACTIVE but past their expiry
      const expiredMarkets = await this.marketRepository.find({
        where: {
          status: MarketStatus.ACTIVE,
          expiryAt: LessThan(new Date()),
        },
      });

      for (const market of expiredMarkets) {
        await this.attemptResolution(market);
      }
    } catch (err) {
      this.logger.error('Error in Resolution Loop', err);
    }
  }

  private async attemptResolution(market: Market) {
    try {
      this.logger.log(`Processing expired market: ${market.ticker}`);

      // 1. Crypto Resolution (Real Data + Fallback)
      if (market.resolutionCriteria.includes('CoinGecko')) {
          let coinId = 'bitcoin';
          let target = 100000;

          if(market.ticker.includes('ETH')) { coinId = 'ethereum'; target = 3000; }
          if(market.ticker.includes('SOL')) { coinId = 'solana'; target = 150; }

          let currentPrice = 0;
          try {
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, { timeout: 3000 });
            currentPrice = response.data[coinId].usd;
          } catch (apiError) {
             this.logger.warn(`⚠️ API Error (${coinId}): ${apiError.message}. Using Mock Oracle.`);
             // Mock prices if API fails
             if(coinId === 'bitcoin') currentPrice = Math.random() > 0.5 ? 105000 : 95000;
             if(coinId === 'ethereum') currentPrice = Math.random() > 0.5 ? 3200 : 2800;
             if(coinId === 'solana') currentPrice = Math.random() > 0.5 ? 160 : 140;
          }

          this.logger.log(`Price Check ${coinId.toUpperCase()}: $${currentPrice} (Target: $${target})`);
          
          const outcome = currentPrice > target ? 'YES' : 'NO';
          this.eventEmitter.emit('MarketResolved', { marketId: market.id, outcome });
          this.logger.log(`Locked Market ${market.ticker} -> ${outcome}`);

      } 
      // 2. Sports / News / Random (Simulation)
      else if (market.resolutionCriteria.includes('Feed')) {
          // 50/50 Random Resolution
          const outcome = Math.random() > 0.5 ? 'YES' : 'NO';
          this.logger.log(`Simulating News/Sports Result for ${market.ticker}: ${outcome}`);
          this.eventEmitter.emit('MarketResolved', { marketId: market.id, outcome });
      }
      else {
        this.logger.warn(`Unknown resolution source for ${market.ticker}`);
      }
    } catch (error) {
       this.logger.error(`Failed to resolve ${market.ticker}`, error.message);
    }
  }
}
