import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementService } from './settlement.service';
import { Market } from '../../domain/entities/market.entity';
import { Position } from '../../domain/entities/position.entity';
import { User } from '../../domain/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Market, Position, User])],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}
