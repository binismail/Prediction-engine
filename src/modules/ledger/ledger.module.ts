import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerService } from './ledger.service';
import { Transaction } from '../../domain/entities/transaction.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
