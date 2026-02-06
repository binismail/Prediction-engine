import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MatchingService } from './matching.service';

@Processor('matching')
export class MatchingProcessor {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(private readonly matchingService: MatchingService) {}

  @Process('execute-trade')
  async handleTrade(job: Job) {
    this.logger.debug(`Processing trade job ${job.id}`);
    const { userId, marketId, side, amount } = job.data;
    
    await this.matchingService.executeTrade(userId, marketId, side, amount);
  }
}
