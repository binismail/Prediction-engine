import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Market } from '../../domain/entities/market.entity';
import { Repository } from 'typeorm';
import { MarketStatus } from '../../domain/value-objects/market-status';
import { CollateralType } from '../../domain/value-objects/collateral';

@Injectable()
export class DiscoveryAgent implements OnModuleInit {
  private readonly logger = new Logger(DiscoveryAgent.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
  ) {}

  onModuleInit() {
    this.logger.log('✅ Discovery Agent Initialized! Starting manual loop...');
    // Manual loop
    setInterval(() => {
      this.scanForMarkets();
    }, 8000); // Check every 8 seconds
  }

  // @Cron removed
  async scanForMarkets() {
    this.logger.log('🕵️ Discovery Agent: Scanning world events...');

    const templates = [
        { ticker: 'BTC-DEMO', question: 'Will Bitcoin be above $100k by tomorrow?', criteria: 'CoinGecko > 100000' },
        { ticker: 'ETH-DEMO', question: 'Will Ethereum be above $3k by tomorrow?', criteria: 'CoinGecko > 3000' },
        { ticker: 'SOL-DEMO', question: 'Will Solana be above $150 by tomorrow?', criteria: 'CoinGecko > 150' },
        { ticker: 'SPORTS-DEMO', question: 'Will Lakers win tonight?', criteria: 'SportsFeed' },
        { ticker: 'NEWS-DEMO', question: 'Will the Fed cut rates this month?', criteria: 'NewsFeed' }
    ];

    // Pick a random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Check if we already have an ACTIVE market for this base ticker
    const existing = await this.marketRepository.createQueryBuilder('market')
      .where("market.ticker LIKE :ticker", { ticker: `${template.ticker}%` })
      .andWhere("market.status = :status", { status: MarketStatus.ACTIVE })
      .getOne();

    if (!existing) {
      const suffix = Math.floor(1000 + Math.random() * 9000); // Random 4-digit
      const newTicker = `${template.ticker}-${suffix}`;
      
      this.logger.log(`💡 Discovery Agent: Creating fresh market: ${newTicker}`);
      
      const market = this.marketRepository.create({
        ticker: newTicker,
        question: template.question,
        resolutionCriteria: template.criteria,
        collateralType: CollateralType.USDC,
        expiryAt: new Date(Date.now() + 1000 * 60 * 3), // Faster expiry (3 mins) for demo
        status: MarketStatus.ACTIVE,
        poolYesBalance: 100, // Initial Liquidity
        poolNoBalance: 100
      });

      await this.marketRepository.save(market);
      this.logger.log(`✨ Market Created: ${newTicker}`);
    } else {
        this.logger.debug(`Active market exists for ${template.ticker}`);
    }
  }
}

