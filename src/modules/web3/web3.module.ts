import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Web3Service } from './web3.service';
import { Web3ListenerService } from './web3-listener.service';
import { User } from '../../domain/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [Web3Service, Web3ListenerService],
  exports: [Web3Service],
})
export class Web3Module {}
