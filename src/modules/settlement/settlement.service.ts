import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Market } from '../../domain/entities/market.entity';
import { MarketStatus } from '../../domain/value-objects/market-status';
import { Position } from '../../domain/entities/position.entity';
import { User } from '../../domain/entities/user.entity';
import { LedgerService } from '../ledger/ledger.service';
import { TransactionType } from '../../domain/value-objects/transaction-type';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly ledgerService: LedgerService,
  ) {}

  @OnEvent('MarketResolved')
  async handleMarketResolved(payload: { marketId: string; outcome: 'YES' | 'NO' }) {
    this.logger.log(`⚖️ Settling market ${payload.marketId} with outcome ${payload.outcome}`);
    
    const market = await this.marketRepository.findOne({ where: { id: payload.marketId } });
    if (!market) return;

    if (market.status === MarketStatus.SETTLED) {
      this.logger.warn(`Market ${market.ticker} is already settled.`);
      return;
    }

    // 1. Fetch all positions
    const positions = await this.positionRepository.find({ 
      where: { marketId: market.id },
      relations: ['user'] 
    });

    this.logger.log(`Found ${positions.length} positions to settle.`);

    // 2. Calculate and Distribute Payouts
    for (const position of positions) {
      let payout = 0;
      
      if (payload.outcome === 'YES') {
        payout = Number(position.yesShares);
      } else {
        payout = Number(position.noShares);
      }

      if (payout > 0) {
        // Credit the user
        const user = position.user;
        const previousBalance = Number(user.availableBalance);
        user.availableBalance = previousBalance + payout;
        
        await this.userRepository.save(user);
        
        // Ledger Record
        await this.ledgerService.record(user.id, TransactionType.WIN_PAYOUT, payout, { marketId: market.id, positionId: position.id });
        
        this.logger.log(`💰 Paid ${payout} USDC to ${user.walletAddress} (New Balance: ${user.availableBalance})`);
      }
    }

    // 3. Mark Market as SETTLED
    await this.marketRepository.update(market.id, { status: MarketStatus.SETTLED });
    this.logger.log(`✅ Market ${market.ticker} settled successfully.`);
  }
}
