import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MarketStatus } from '../value-objects/market-status';
import { CollateralType } from '../value-objects/collateral';
import { Trade } from './trade.entity';
import { Position } from './position.entity';
import { MarketEvent } from './market-event.entity';
// We'll define MarketEvent later or use a generic event store, 
// for now let's keep the entity clean as per plan.

@Entity()
export class Market {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  ticker: string;

  @Column()
  question: string;

  @Column()
  resolutionCriteria: string;

  @Column({
    type: 'enum',
    enum: CollateralType,
  })
  collateralType: CollateralType;

  @Column()
  expiryAt: Date;

  @Column({
    type: 'enum',
    enum: MarketStatus,
    default: MarketStatus.PENDING,
  })
  status: MarketStatus;

  // CPMM Liquidity Pools
  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  poolYesBalance: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  poolNoBalance: number;


  @OneToMany(() => Trade, (trade) => trade.market)
  trades: Trade[];

  @OneToMany(() => Position, (position) => position.market)
  positions: Position[];

  @OneToMany(() => MarketEvent, (event) => event.market)
  events: MarketEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
