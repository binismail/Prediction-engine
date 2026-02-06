import { Module } from '@nestjs/common';
import { TradingController } from './trading.controller';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [MatchingModule],
  controllers: [TradingController],
})
export class TradingModule {}
