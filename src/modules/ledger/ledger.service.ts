import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../domain/value-objects/transaction-type';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async record(
    userId: string,
    type: TransactionType,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    const tx = this.transactionRepository.create({
      userId,
      type,
      amount,
      metadata,
    });
    
    await this.transactionRepository.save(tx);
    // this.logger.log(`📒 Ledger: ${type} ${amount} for User ${userId}`);
    return tx;
  }

  async getUserHistory(userId: string) {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
