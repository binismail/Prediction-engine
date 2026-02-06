import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trade } from './trade.entity';
import { Position } from './position.entity';

@Entity()
export class User {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ nullable: true, unique: true })
  email?: string;

  @Column({ nullable: true })
  password?: string; // Plaintext for demo, hash in prod

  @Column({ default: 'USER' })
  role: string; // 'USER' | 'ADMIN'

  // Off-chain balance tracking for "Trading Credits"
  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  availableBalance: number;

  @OneToMany(() => Trade, (trade) => trade.user)
  trades: Trade[];

  @OneToMany(() => Position, (position) => position.user)
  positions: Position[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
