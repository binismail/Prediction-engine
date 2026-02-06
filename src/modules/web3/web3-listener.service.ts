import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Repository } from 'typeorm';
import { ethers, Contract, JsonRpcProvider } from 'ethers';

// Minimal ABI for indexing
const VAULT_ABI = [
  'event Deposit(address indexed user, uint256 amount)',
];

@Injectable()
export class Web3ListenerService implements OnModuleInit {
  private readonly logger = new Logger(Web3ListenerService.name);
  private provider: JsonRpcProvider;
  private vault: Contract;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  onModuleInit() {
    this.startListening();
  }

  startListening() {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const vaultAddress = this.configService.get<string>('VAULT_ADDRESS');

    if (!rpcUrl || !vaultAddress) {
      this.logger.warn('Web3 Listener disabled: RPC_URL or VAULT_ADDRESS missing');
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.vault = new ethers.Contract(vaultAddress, VAULT_ABI, this.provider);

      this.logger.log(`🎧 Listening for Deposits on ${vaultAddress}`);

      this.vault.on('Deposit', async (userAddress, amountRaw, event) => {
        const amount = Number(ethers.formatUnits(amountRaw, 6)); // Assuming USDC (6 decimals)
        this.logger.log(`💰 Deposit Detected: ${userAddress} deposited $${amount}`);
        
        await this.creditUser(userAddress, amount);
      });

    } catch (error) {
      this.logger.error('Failed to start Web3 Listener', error);
    }
  }

  async creditUser(walletAddress: string, amount: number) {
    try {
      let user = await this.userRepository.findOne({ where: { walletAddress } });
      
      if (!user) {
        this.logger.log(`Creating new user for depositor: ${walletAddress}`);
        user = this.userRepository.create({ walletAddress, availableBalance: 0 });
      }

      // Safe update
      const current = parseFloat(user.availableBalance?.toString() || '0');
      user.availableBalance = current + amount;
      
      await this.userRepository.save(user);
      this.logger.log(`✅ Credited ${amount} to ${walletAddress}. New Balance: ${user.availableBalance}`);
      
    } catch (err) {
      this.logger.error(`Failed to credit user ${walletAddress}`, err);
    }
  }
}
