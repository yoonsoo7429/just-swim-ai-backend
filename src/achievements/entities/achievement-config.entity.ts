import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

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
  PACE_IMPROVEMENT = 'pace_improvement', // 새로운 페이스 개선 성취
  COMPLEX_TRAINING = 'complex_training', // 복합 훈련 성취
}

export enum AchievementLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('achievement_configs')
export class AchievementConfig extends BaseEntity {
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

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @Column({ type: 'int' })
  target: number;

  @Column({ type: 'json', nullable: true })
  conditions?: any; // 추가 조건 (예: 특정 영법, 특정 페이스 등)

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // 정렬 순서
}
