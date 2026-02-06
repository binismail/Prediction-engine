import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketEvent } from '../../domain/entities/market-event.entity';

@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(MarketEvent)
    private readonly eventRepository: Repository<MarketEvent>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Persist an event and publish it to the internal event bus
   */
  async append(
    marketId: string,
    eventType: string,
    data: any,
  ): Promise<MarketEvent> {
    const event = this.eventRepository.create({
      marketId,
      eventType,
      eventData: data,
    });

    const savedEvent = await this.eventRepository.save(event);

    // Publish to internal subscribers (e.g. StateMachine, ProjectionBuilders)
    this.eventEmitter.emit(eventType, {
      ...data,
      metadata: { timestamp: savedEvent.createdAt, eventId: savedEvent.id },
    });

    return savedEvent;
  }

  /**
   * Retrieve full event stream for a market to rebuild state
   */
  async getStream(marketId: string): Promise<MarketEvent[]> {
    return this.eventRepository.find({
      where: { marketId },
      order: { createdAt: 'ASC' },
    });
  }
}
