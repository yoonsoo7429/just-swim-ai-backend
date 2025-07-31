import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WearableProvider } from './wearable-connection.entity';

export enum ActivityType {
  SWIMMING = 'swimming',
  RUNNING = 'running',
  CYCLING = 'cycling',
  WALKING = 'walking',
  WORKOUT = 'workout',
}

export enum SwimStyle {
  FREESTYLE = 'freestyle',
  BACKSTROKE = 'backstroke',
  BREASTSTROKE = 'breaststroke',
  BUTTERFLY = 'butterfly',
  MIXED = 'mixed',
  UNKNOWN = 'unknown',
}

@Entity()
export class WearableData {
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
  externalActivityId: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column({
    type: 'enum',
    enum: SwimStyle,
    nullable: true,
  })
  swimStyle: SwimStyle;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'float' })
  duration: number; // seconds

  @Column({ type: 'float', nullable: true })
  distance: number; // meters

  @Column({ type: 'float', nullable: true })
  calories: number;

  @Column({ type: 'float', nullable: true })
  averageHeartRate: number;

  @Column({ type: 'float', nullable: true })
  maxHeartRate: number;

  @Column({ type: 'float', nullable: true })
  averageSpeed: number; // m/s

  @Column({ type: 'float', nullable: true })
  maxSpeed: number; // m/s

  @Column({ type: 'int', nullable: true })
  strokeCount: number;

  @Column({ type: 'float', nullable: true })
  strokeRate: number; // strokes per minute

  @Column({ type: 'json', nullable: true })
  segments: any[]; // 상세 세그먼트 데이터

  @Column({ type: 'json', nullable: true })
  rawData: any; // 원본 데이터

  @Column({ default: false })
  isProcessed: boolean;

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
