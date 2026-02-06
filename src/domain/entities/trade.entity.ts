import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Market } from './market.entity';
import { User } from './user.entity';
import { TradeSide } from '../value-objects/collateral';

@Entity()
export class Trade {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  marketId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: TradeSide,
  })
  side: TradeSide;

  @Column('decimal', { precision: 18, scale: 8 })
  amount: number;

  @Column('decimal', { precision: 18, scale: 8 })
  sharesReceived: number;

  @Column('decimal', { precision: 18, scale: 8 })
  priceAtExecution: number;

  @Column({ nullable: true })
  txHash: string; // Will be null for off-chain trades until settlement? 
  // Actually, for off-chain matching, this might only be populated if we anchored it. 
  // But given the plan: "One Batch Settlement per Market", individual trades don't have txHashes.
  // Keeping it nullable for flexibility.

  @ManyToOne(() => Market, (market) => market.trades)
  market: Market;

  @ManyToOne(() => User, (user) => user.trades)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
