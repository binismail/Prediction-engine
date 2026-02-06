import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Market } from './market.entity';
import { User } from './user.entity';

@Entity()
@Unique(['userId', 'marketId'])
export class Position {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  userId: string;

  @Column()
  marketId: string;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  yesShares: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  noShares: number;

  @ManyToOne(() => Market, (market) => market.positions)
  market: Market;

  @ManyToOne(() => User, (user) => user.positions)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
