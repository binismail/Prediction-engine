import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Market } from './market.entity';

@Entity()
@Index(['market', 'createdAt'])
export class MarketEvent {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  marketId: string;

  @Column()
  eventType: string;

  @Column('jsonb')
  eventData: any; // Using jsonb for flexibility in Postgres

  @ManyToOne(() => Market, (market) => market.events)
  market: Market;

  @CreateDateColumn()
  createdAt: Date;
}
