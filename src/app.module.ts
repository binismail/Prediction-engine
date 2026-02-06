import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { Market } from './domain/entities/market.entity';
import { Trade } from './domain/entities/trade.entity';
import { Position } from './domain/entities/position.entity';
import { User } from './domain/entities/user.entity';
import { MarketEvent } from './domain/entities/market-event.entity';
import { MarketsModule } from './modules/markets/markets.module';
import { EventStoreModule } from './modules/event-store/event-store.module';
import { MatchingModule } from './modules/matching/matching.module';
import { Web3Module } from './modules/web3/web3.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { TradingModule } from './modules/trading/trading.module';
import { AgentsModule } from './agents/agents.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'demo'), // Serve "demo" folder
      exclude: ['/api/(.*)'], // Don't block API routes
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.getOrThrow('database'),
      inject: [ConfigService],
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    TypeOrmModule.forFeature([Market, Trade, Position, User, MarketEvent]),
    LedgerModule, // Global Module
    MarketsModule,
    EventStoreModule,
    MatchingModule,
    TradingModule,
    Web3Module,
    SettlementModule,
    AgentsModule,
    UsersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
