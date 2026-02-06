import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from '../../domain/entities/market.entity';
import { Trade } from '../../domain/entities/trade.entity';
import { StateMachineService } from './state-machine.service';
import { EventStoreModule } from '../event-store/event-store.module';
// We'll add Controller and Service later

import { MarketsController } from './markets.controller';
import { MarketGateway } from '../../gateways/market.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, Trade]),
    EventStoreModule,
  ],
  controllers: [MarketsController],
  providers: [StateMachineService, MarketGateway],
  exports: [StateMachineService],
})
export class MarketsModule {}
