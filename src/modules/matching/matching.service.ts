import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from '../../domain/entities/trade.entity';
import { Market } from '../../domain/entities/market.entity';
import { User } from '../../domain/entities/user.entity';
import { Position } from '../../domain/entities/position.entity';
import { TradeSide } from '../../domain/value-objects/collateral';
import { LedgerService } from '../ledger/ledger.service';
import { TransactionType } from '../../domain/value-objects/transaction-type';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Market)
    private readonly marketRepository: Repository<Market>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Execute a trade against the AMM
   * MVP Implementation: Simple 1:1 matching (no price curve yet)
   * 1 Share = $1. If you buy $10, you get 10 Shares.
   */
  async executeTrade(userId: string, marketId: string, side: TradeSide, amount: number) {
    this.logger.log(`Executing trade: User ${userId} buying ${side} for ${amount} in ${marketId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    
    const market = await this.marketRepository.findOne({ where: { id: marketId } });
    if (!market) throw new BadRequestException('Market not found');

    // 1. Check Balance
    if (user.availableBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // 2. Deduct User Balance
    user.availableBalance = Number(user.availableBalance) - amount;
    await this.userRepository.save(user);

    // --- CPMM LOGIC START ---
    
    // A. Apply Fee (1%)
    const FEE_PERCENT = 0.01;
    const fee = amount * FEE_PERCENT;
    const amountAfterFee = amount - fee;
    this.logger.log(`💰 Trade Fee: ${fee} (Net: ${amountAfterFee})`);

    // B. Calculate Price & Impact
    // CPMM Formula: k = x * y
    // For a trade of 'dx' amount of ONE side, how much 'dy' shares do we get?
    // Using a simplified variant for "Fixed Product Market Maker" where we just add to pool 
    // and recalculate price, or use the standard AMM swap formula.
    
    // Approach: Constant Product (x * y = k)
    // If buying YES:
    // (YesPool + Amount) * (NoPool - SharesOut) = k
    // SharesOut = NoPool - (k / (YesPool + Amount))
    
    let yesPool = Number(market.poolYesBalance);
    let noPool = Number(market.poolNoBalance);
    const k = yesPool * noPool;

    let shares = 0;
    let price = 0.5; // Default reference

    if (side === TradeSide.YES) {
      // User puts in 'amount' of collateral (effectively adding to YES pool demand)
      // Actually in prediction markets:
      // You put in $10. The pool effectively takes your $10, splitting it across the pools
      // This is complex. Let's use the Probability Formula for readability in MVP.
      
      // SIMPLIFIED PROBABILITY PRICING (LMSR-lite):
      // Price = Pool_Other / (Pool_Yes + Pool_No)
      
      // Let's stick to the "Outcome Shares" model where User BUYS shares from the pool.
      // We use the CPMM formula: (PoolYes + Investment) * (PoolNo - SharesOutput) = K ?? 
      // No, that's for Token A/Token B.
      
      // Correct Prediction Market CPMM:
      // You buy YES shares. You pay 'amount' USD.
      // The pool keeps your USD. The pool mints/sends you YES shares.
      // Wait, standard CPMM is: Cost = Log(e^q1 + e^q2) is LMSR.
      // CPMM for Binary is: y = k/x.
      
      // Let's implement the Uniswap V2 Style Swap:
      // Input: USDC (AmountAfterFee)
      // Output: YES Shares.
      // The "Pool" consists of USDC reserves for YES and NO? No.
      // The Pool tracks "Outstanding Shares".
      
      // Let's revert to the simplest robust model: "Fixed Probability Pricing based on Ratio"
      // New Pool = Old Pool + Amount.
      // Price = Ratio.
      // This technically changes the 'k', but works for simple prediction markets.
      
      // IMPLEMENTATION:
      // We treat the "Pools" as weights.
      // Buying YES adds to YesPool weight.
      // Price YES = YesPool / (YesPool + NoPool).
      // Shares = Amount / Price.
      
      yesPool += amountAfterFee;
      const totalPool = yesPool + noPool;
      price = yesPool / totalPool; // This is actually the price of YES *after* the trade (slippage included)
      
      shares = amountAfterFee / price; // This approximates the swap
      
      // Update Market State
      market.poolYesBalance = yesPool; // We implicitly added liquidity to the YES side demand
    } else {
      // Buying NO
      noPool += amountAfterFee;
      const totalPool = yesPool + noPool;
      price = noPool / totalPool;
      
      shares = amountAfterFee / price;
      
      market.poolNoBalance = noPool;
    }

    await this.marketRepository.save(market);

    this.logger.log(`📊 CPMM Update: Price ${price.toFixed(4)}, Shares Out: ${shares.toFixed(2)}`);

    // --- CPMM LOGIC END ---

    // 4. Update/Create Position
    let position = await this.positionRepository.findOne({ where: { userId, marketId } });
    if (!position) {
      position = this.positionRepository.create({ userId, marketId, yesShares: 0, noShares: 0 });
    }

    if (side === TradeSide.YES) {
      position.yesShares = Number(position.yesShares) + shares;
    } else {
      position.noShares = Number(position.noShares) + shares;
    }
    await this.positionRepository.save(position);

    // 5. Record Trade
    const trade = this.tradeRepository.create({
      userId,
      marketId,
      side,
      amount,
      priceAtExecution: price,
      sharesReceived: shares,
    });
    // Record fee if we had a field, for now just logging it.
    await this.tradeRepository.save(trade);

    // 6. Ledger Entries
    // Debit User (Trade Amount)
    await this.ledgerService.record(userId, TransactionType.TRADE_BUY, -amountAfterFee, { marketId, tradeId: trade.id, side });
    // Debit User (Fee)
    await this.ledgerService.record(userId, TransactionType.PROTOCOL_FEE, -fee, { marketId, tradeId: trade.id });

    return {
      status: 'EXECUTED',
      tradeId: trade.id,
      shares,
      price,
      newBalance: user.availableBalance
    };
  }

  /**
   * Sell shares back to the AMM (Burn)
   */
  async executeSell(userId: string, marketId: string, side: TradeSide, sharesToSell: number) {
    this.logger.log(`Executing SELL: User ${userId} selling ${sharesToSell} ${side} in ${marketId}`);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    
    const market = await this.marketRepository.findOne({ where: { id: marketId } });
    if (!market) throw new BadRequestException('Market not found');

    const position = await this.positionRepository.findOne({ where: { userId, marketId } });
    if (!position) throw new BadRequestException('No position found');

    // 1. Check Ownership
    const currentShares = side === TradeSide.YES ? Number(position.yesShares) : Number(position.noShares);
    if (currentShares < sharesToSell) {
      throw new BadRequestException(`Insufficient shares. You have ${currentShares}, trying to sell ${sharesToSell}`);
    }

    // 2. Calculate Payout (Reverse CPMM)
    // When you buy, you Add USDC -> Get Shares.
    // When you sell, you Give Shares -> Get USDC.
    // Simplification: We pay out based on current Spot Price * Shares.
    // (In full AMM, we would remove from pool and calculate impact, but Spot Price is fine for MVP v2)
    
    let yesPool = Number(market.poolYesBalance);
    let noPool = Number(market.poolNoBalance);
    let price = 0;

    if (side === TradeSide.YES) {
      price = yesPool / (yesPool + noPool);
      // Remove liquidity from YES side (selling reduces demand/weight)
      // Wait, if I sell YES, I am effectively reducing the YES demand.
      // So yesPool should decrease?
      // Or rather, the "USDC Value" of the pool decreases.
      
      // Let's model it as: User "Returns" shares.
      // We calculate value based on ratio.
      const payout = sharesToSell * price;
      
      // Apply Fee on exit too? Let's be nice and say no fee on exit for now, or 1%.
      // Let's apply 1% exit fee.
      const fee = payout * 0.01;
      const netPayout = payout - fee;

      user.availableBalance = Number(user.availableBalance) + netPayout;
      
      // Update Pools: Selling YES reduces the YES weight.
      // This makes YES cheaper (as expected).
      market.poolYesBalance = yesPool - netPayout; // We remove the capital associated with it
      
      // Update Position
      position.yesShares = Number(position.yesShares) - sharesToSell;
      if (position.yesShares < 0.0001) position.yesShares = 0; // Dust cleanup

      await this.userRepository.save(user);
      await this.marketRepository.save(market);
      await this.positionRepository.save(position);

      await this.ledgerService.record(userId, TransactionType.TRADE_SELL, netPayout, { marketId, side, shares: sharesToSell });
      await this.ledgerService.record(userId, TransactionType.PROTOCOL_FEE, -fee, { marketId, type: 'EXIT_FEE' });

      this.logger.log(`💵 SELL Complete: Sold ${sharesToSell} YES @ ${price.toFixed(3)}. Payout: ${netPayout}`);
      
      return { status: 'SOLD', payout: netPayout, price };

    } else {
      // Selling NO
      price = noPool / (yesPool + noPool);
      const payout = sharesToSell * price;
      const fee = payout * 0.01;
      const netPayout = payout - fee;

      user.availableBalance = Number(user.availableBalance) + netPayout;
      market.poolNoBalance = noPool - netPayout;

      position.noShares = Number(position.noShares) - sharesToSell;
      if (position.noShares < 0.0001) position.noShares = 0;

      await this.userRepository.save(user);
      await this.marketRepository.save(market);
      await this.positionRepository.save(position);

      await this.ledgerService.record(userId, TransactionType.TRADE_SELL, netPayout, { marketId, side, shares: sharesToSell });
      await this.ledgerService.record(userId, TransactionType.PROTOCOL_FEE, -fee, { marketId, type: 'EXIT_FEE' });

      this.logger.log(`💵 SELL Complete: Sold ${sharesToSell} NO @ ${price.toFixed(3)}. Payout: ${netPayout}`);

      return { status: 'SOLD', payout: netPayout, price };
    }
  }
}
