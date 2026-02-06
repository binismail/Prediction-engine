import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class MatchingQueue {
  constructor(@InjectQueue('matching') private matchingQueue: Queue) {}

  async addTrade(job: any) {
    await this.matchingQueue.add('execute-trade', job);
  }
}
