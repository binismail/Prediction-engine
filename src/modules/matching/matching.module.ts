import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingService } from './matching.service';
import { Trade } from '../../domain/entities/trade.entity';
import { Market } from '../../domain/entities/market.entity';

import { BullModule } from '@nestjs/bull';
import { MatchingQueue } from './matching.queue';
import { MatchingProcessor } from './matching.processor';

import { User } from '../../domain/entities/user.entity';
import { Position } from '../../domain/entities/position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Market, User, Position]),
    BullModule.registerQueue({
      name: 'matching',
    }),
  ],
  providers: [MatchingService, MatchingQueue, MatchingProcessor],
  exports: [MatchingService, MatchingQueue],
})
export class MatchingModule {}
