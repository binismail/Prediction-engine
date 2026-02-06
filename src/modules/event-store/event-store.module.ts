import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventStoreService } from './event-store.service';
import { MarketEvent } from '../../domain/entities/market-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarketEvent])],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}
