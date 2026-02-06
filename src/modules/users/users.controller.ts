import { Controller, Post, Body, Param, Get, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { DepositDto } from './dto/deposit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LedgerService } from '../ledger/ledger.service';
import { TransactionType } from '../../domain/value-objects/transaction-type';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly ledgerService: LedgerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() dto: CreateUserDto) {
    // Check if exists (Idempotent / Login)
    const existing = await this.userRepository.findOne({ where: { walletAddress: dto.walletAddress } });
    if (existing) {
        this.logger.log(`User login: ${existing.walletAddress}`);
        return existing;
    }

    const user = this.userRepository.create({
      walletAddress: dto.walletAddress,
      availableBalance: 0,
    });
    return this.userRepository.save(user);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin Login' })
  async adminLogin(@Body() body: any) {
    const { email, password } = body;
    const user = await this.userRepository.findOne({ where: { email } });
    
    if(!user || user.password !== password) { 
        throw new NotFoundException('Invalid credentials');
    }
    if(user.role !== 'ADMIN') {
        throw new NotFoundException('Not an admin');
    }
    return user;
  }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Mock deposit for testing (Dev only)' })
  async mockDeposit(@Param('id') id: string, @Body() dto: DepositDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    // Check if balance is string (TypeORM behavior) and parse
    let current = 0;
    if (user.availableBalance !== null && user.availableBalance !== undefined) {
      current = parseFloat(user.availableBalance.toString());
    }
    
    if (isNaN(current)) {
      this.logger.warn(`User ${user.id} has invalid balance: ${user.availableBalance}. Resetting to 0.`);
      current = 0;
    }

    user.availableBalance = current + dto.amount;
    this.logger.log(`Updating balance for user ${id}: ${current} -> ${user.availableBalance}`);
    
    await this.userRepository.save(user);

    // Ledger Record
    await this.ledgerService.record(user.id, TransactionType.DEPOSIT, dto.amount, { method: 'MOCK_API' });

    return user;
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get user transaction ledger' })
  async getTransactions(@Param('id') id: string) {
    return this.ledgerService.getUserHistory(id);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userRepository.findOne({ where: { id }, relations: ['positions', 'trades'] });
  }
}
