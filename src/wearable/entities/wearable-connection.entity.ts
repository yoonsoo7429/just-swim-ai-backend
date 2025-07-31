import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WearableProvider {
  APPLE_HEALTH = 'apple_health',
  GOOGLE_FIT = 'google_fit',
  GARMIN_CONNECT = 'garmin_connect',
  FITBIT = 'fitbit',
  STRAVA = 'strava',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ERROR = 'error',
}

@Entity()
export class WearableConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'enum',
    enum: WearableProvider,
  })
  provider: WearableProvider;

  @Column()
  externalUserId: string;

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @Column({ type: 'json', nullable: true })
  accessToken: any;

  @Column({ type: 'json', nullable: true })
  refreshToken: any;

  @Column({ nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
