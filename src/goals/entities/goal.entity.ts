import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum GoalType {
  DISTANCE = 'distance',
  TIME = 'time',
  FREQUENCY = 'frequency',
  SPEED = 'speed',
  STYLE_MASTERY = 'style_mastery',
  STREAK = 'streak',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

@Entity('goals')
export class Goal extends BaseEntity {
  @Column()
  userId: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  type: GoalType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  targetValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentValue: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string; // km, minutes, times, etc.

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0-100 percentage

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recurringType: string; // daily, weekly, monthly

  @ManyToOne(() => User, (user) => user.goals)
  @JoinColumn({ name: 'userId' })
  user: User;
}
