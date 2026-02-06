import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);
  private readonly signer: ethers.Wallet;
  private readonly provider: ethers.JsonRpcProvider;

  constructor(private readonly configService: ConfigService) {
    // Setup signer for EIP-712 withdrawals
    const privateKey = this.configService.get<string>('SIGNER_PRIVATE_KEY');
    const rpcUrl = this.configService.get<string>('RPC_URL');
    
    if (privateKey && rpcUrl && privateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      try {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
      } catch (error) {
        this.logger.error(`Failed to initialize wallet: ${error.message}`);
      }
    } else {
      this.logger.warn('Web3 config missing or invalid: SIGNER_PRIVATE_KEY or RPC_URL not valid');
    }
  }

  /**
   * Generate EIP-712 signature for user withdrawal
   */
  async generateWithdrawalSignature(
    userAddress: string,
    amount: bigint,
    nonce: number,
    contractAddress: string
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Server signer not configured');
    }

    const domain = {
      name: 'PredictionEngine',
      version: '1',
      chainId: (await this.provider.getNetwork()).chainId,
      verifyingContract: contractAddress,
    };

    const types = {
      Withdraw: [
        { name: 'user', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const value = {
      user: userAddress,
      amount: amount.toString(),
      nonce,
    };

    return this.signer.signTypedData(domain, types, value);
  }
}
