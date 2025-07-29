import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum AchievementType {
  FIRST_TRAINING = 'first_training',
  DISTANCE_MILESTONE = 'distance_milestone',
  TIME_MILESTONE = 'time_milestone',
  STREAK_WEEK = 'streak_week',
  STREAK_MONTH = 'streak_month',
  STYLE_MASTER = 'style_master',
  SPEED_IMPROVEMENT = 'speed_improvement',
  CONSISTENCY = 'consistency',
  GOAL_ACHIEVER = 'goal_achiever',
}

export enum AchievementLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('achievements')
export class Achievement extends BaseEntity {
  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: AchievementType,
  })
  type: AchievementType;

  @Column({
    type: 'enum',
    enum: AchievementLevel,
  })
  level: AchievementLevel;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  icon: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'int', default: 0 })
  target: number;

  @Column({ type: 'boolean', default: false })
  isUnlocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  unlockedAt: Date | null;

  @ManyToOne(() => User, (user) => user.achievements)
  @JoinColumn({ name: 'userId' })
  user: User;
}
