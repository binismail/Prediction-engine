import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { Market } from '../../domain/entities/market.entity';
import { Trade } from '../../domain/entities/trade.entity';
import { User } from '../../domain/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market, Trade, User]),
  ],
  controllers: [AdminController],
})
export class AdminModule implements OnModuleInit {
  private readonly logger = new Logger(AdminModule.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    this.logger.log('Checking for Admin User...');
    const adminEmail = 'admin123@gmail.com';
    const existing = await this.userRepository.findOne({ where: { email: adminEmail } });
    
    if(!existing) {
        const admin = this.userRepository.create({
            email: adminEmail,
            password: 'admin123', // Demo plaintext
            role: 'ADMIN',
            walletAddress: '0xADMIN123', // Dummy wallet
            availableBalance: 1000000
        });
        await this.userRepository.save(admin);
        this.logger.log(`✅ Admin User Seeded: ${adminEmail}`);
    } else {
        this.logger.debug(`Admin user already exists.`);
    }
  }
}
