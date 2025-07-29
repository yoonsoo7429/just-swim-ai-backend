import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Achievement,
  AchievementType,
  AchievementLevel,
} from './entities/achievement.entity';
import { Record } from '../records/entities/record.entity';

interface AchievementConfig {
  type: AchievementType;
  level: AchievementLevel;
  title: string;
  description: string;
  icon: string;
  target: number;
}

@Injectable()
export class AchievementsService {
  private readonly achievementConfigs: AchievementConfig[] = [
    // 첫 훈련
    {
      type: AchievementType.FIRST_TRAINING,
      level: AchievementLevel.BRONZE,
      title: '첫 번째 훈련',
      description: '첫 번째 수영 훈련을 완료했습니다!',
      icon: '🏊‍♂️',
      target: 1,
    },
    // 거리 마일스톤
    {
      type: AchievementType.DISTANCE_MILESTONE,
      level: AchievementLevel.BRONZE,
      title: '수영 초보자',
      description: '총 1km를 수영했습니다!',
      icon: '🌊',
      target: 1000,
    },
    {
      type: AchievementType.DISTANCE_MILESTONE,
      level: AchievementLevel.SILVER,
      title: '수영 애호가',
      description: '총 5km를 수영했습니다!',
      icon: '🏊‍♀️',
      target: 5000,
    },
    {
      type: AchievementType.DISTANCE_MILESTONE,
      level: AchievementLevel.GOLD,
      title: '수영 마스터',
      description: '총 10km를 수영했습니다!',
      icon: '🏆',
      target: 10000,
    },
    {
      type: AchievementType.DISTANCE_MILESTONE,
      level: AchievementLevel.PLATINUM,
      title: '수영 전설',
      description: '총 50km를 수영했습니다!',
      icon: '👑',
      target: 50000,
    },
    // 시간 마일스톤
    {
      type: AchievementType.TIME_MILESTONE,
      level: AchievementLevel.BRONZE,
      title: '시간 투자자',
      description: '총 1시간을 수영했습니다!',
      icon: '⏰',
      target: 60,
    },
    {
      type: AchievementType.TIME_MILESTONE,
      level: AchievementLevel.SILVER,
      title: '시간 관리자',
      description: '총 5시간을 수영했습니다!',
      icon: '⏱️',
      target: 300,
    },
    {
      type: AchievementType.TIME_MILESTONE,
      level: AchievementLevel.GOLD,
      title: '시간 마스터',
      description: '총 10시간을 수영했습니다!',
      icon: '⌛',
      target: 600,
    },
    // 연속 훈련
    {
      type: AchievementType.STREAK_WEEK,
      level: AchievementLevel.BRONZE,
      title: '일주일 연속',
      description: '일주일 연속으로 수영했습니다!',
      icon: '📅',
      target: 7,
    },
    {
      type: AchievementType.STREAK_MONTH,
      level: AchievementLevel.SILVER,
      title: '한 달 연속',
      description: '한 달 연속으로 수영했습니다!',
      icon: '📆',
      target: 30,
    },
    // 영법 마스터
    {
      type: AchievementType.STYLE_MASTER,
      level: AchievementLevel.BRONZE,
      title: '자유형 마스터',
      description: '자유형으로 10회 훈련했습니다!',
      icon: '🏊‍♂️',
      target: 10,
    },
    {
      type: AchievementType.STYLE_MASTER,
      level: AchievementLevel.SILVER,
      title: '영법 다재다능',
      description: '모든 영법으로 훈련했습니다!',
      icon: '🎯',
      target: 4,
    },
    // 속도 개선
    {
      type: AchievementType.SPEED_IMPROVEMENT,
      level: AchievementLevel.BRONZE,
      title: '속도 개선',
      description: '이전 기록 대비 10% 속도 향상!',
      icon: '⚡',
      target: 10,
    },
    // 일관성
    {
      type: AchievementType.CONSISTENCY,
      level: AchievementLevel.BRONZE,
      title: '꾸준함',
      description: '한 달 동안 주 3회 이상 수영!',
      icon: '📈',
      target: 12,
    },
    // 목표 달성
    {
      type: AchievementType.GOAL_ACHIEVER,
      level: AchievementLevel.BRONZE,
      title: '목표 달성자',
      description: '첫 번째 목표를 달성했습니다!',
      icon: '🎯',
      target: 1,
    },
  ];

  constructor(
    @InjectRepository(Achievement)
    private achievementsRepository: Repository<Achievement>,
    @InjectRepository(Record)
    private recordsRepository: Repository<Record>,
  ) {}

  // 사용자의 모든 성취 조회
  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return this.achievementsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  // 사용자의 잠금 해제된 성취 조회
  async getUnlockedAchievements(userId: number): Promise<Achievement[]> {
    return this.achievementsRepository.find({
      where: { userId, isUnlocked: true },
      order: { unlockedAt: 'DESC' },
    });
  }

  // 새로운 성취 확인 및 생성
  async checkAndCreateAchievements(userId: number): Promise<Achievement[]> {
    const userRecords = await this.recordsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    if (userRecords.length === 0) return [];

    const newAchievements: Achievement[] = [];
    const totalDistance = userRecords.reduce(
      (sum, record) => sum + Number(record.distance),
      0,
    );
    const totalTime = userRecords.reduce(
      (sum, record) => sum + record.duration,
      0,
    );
    const totalRecords = userRecords.length;

    // 각 성취 타입별로 확인
    for (const config of this.achievementConfigs) {
      const existingAchievement = await this.achievementsRepository.findOne({
        where: { userId, type: config.type, level: config.level },
      });

      if (existingAchievement && existingAchievement.isUnlocked) {
        continue; // 이미 잠금 해제된 성취는 건너뛰기
      }

      let progress = 0;
      let shouldUnlock = false;

      switch (config.type) {
        case AchievementType.FIRST_TRAINING:
          progress = totalRecords;
          shouldUnlock = totalRecords >= config.target;
          break;

        case AchievementType.DISTANCE_MILESTONE:
          progress = totalDistance;
          shouldUnlock = totalDistance >= config.target;
          break;

        case AchievementType.TIME_MILESTONE:
          progress = totalTime;
          shouldUnlock = totalTime >= config.target;
          break;

        case AchievementType.STREAK_WEEK:
          progress = this.calculateStreak(userRecords);
          shouldUnlock = progress >= config.target;
          break;

        case AchievementType.STREAK_MONTH:
          progress = this.calculateStreak(userRecords);
          shouldUnlock = progress >= config.target;
          break;

        case AchievementType.STYLE_MASTER:
          if (config.level === AchievementLevel.BRONZE) {
            // 자유형 10회
            const freestyleCount = userRecords.filter(
              (r) => r.style === 'freestyle',
            ).length;
            progress = freestyleCount;
            shouldUnlock = freestyleCount >= config.target;
          } else if (config.level === AchievementLevel.SILVER) {
            // 모든 영법
            const uniqueStyles = new Set(userRecords.map((r) => r.style));
            progress = uniqueStyles.size;
            shouldUnlock = uniqueStyles.size >= config.target;
          }
          break;

        case AchievementType.SPEED_IMPROVEMENT:
          progress = this.calculateSpeedImprovement(userRecords);
          shouldUnlock = progress >= config.target;
          break;

        case AchievementType.CONSISTENCY:
          progress = this.calculateConsistency(userRecords);
          shouldUnlock = progress >= config.target;
          break;

        case AchievementType.GOAL_ACHIEVER:
          progress = this.calculateGoalAchievements(userRecords);
          shouldUnlock = progress >= config.target;
          break;
      }

      if (existingAchievement) {
        // 기존 성취 업데이트
        existingAchievement.progress = progress;
        if (shouldUnlock && !existingAchievement.isUnlocked) {
          existingAchievement.isUnlocked = true;
          existingAchievement.unlockedAt = new Date();
          newAchievements.push(existingAchievement);
        }
        await this.achievementsRepository.save(existingAchievement);
      } else {
        // 새 성취 생성
        const achievementData = {
          userId,
          type: config.type,
          level: config.level,
          title: config.title,
          description: config.description,
          icon: config.icon,
          progress,
          target: config.target,
          isUnlocked: shouldUnlock,
          unlockedAt: shouldUnlock ? new Date() : null,
        };

        const achievement = this.achievementsRepository.create(achievementData);
        const savedAchievement =
          await this.achievementsRepository.save(achievement);

        if (shouldUnlock) {
          newAchievements.push(savedAchievement);
        }
      }
    }

    return newAchievements;
  }

  // 연속 훈련 일수 계산
  private calculateStreak(records: Record[]): number {
    if (records.length === 0) return 0;

    const sortedRecords = records.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    let streak = 1;
    let currentDate = new Date(sortedRecords[0].date);

    for (let i = 1; i < sortedRecords.length; i++) {
      const recordDate = new Date(sortedRecords[i].date);
      const diffTime = currentDate.getTime() - recordDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        currentDate = recordDate;
      } else {
        break;
      }
    }

    return streak;
  }

  // 속도 개선도 계산
  private calculateSpeedImprovement(records: Record[]): number {
    if (records.length < 2) return 0;

    const recentRecords = records.slice(-5); // 최근 5개 기록
    const speeds = recentRecords.map((r) => Number(r.distance) / r.duration);
    const avgSpeed =
      speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

    // 이전 기록들과 비교
    const olderRecords = records.slice(0, -5);
    if (olderRecords.length === 0) return 0;

    const olderSpeeds = olderRecords.map(
      (r) => Number(r.distance) / r.duration,
    );
    const avgOlderSpeed =
      olderSpeeds.reduce((sum, speed) => sum + speed, 0) / olderSpeeds.length;

    if (avgOlderSpeed === 0) return 0;

    return ((avgSpeed - avgOlderSpeed) / avgOlderSpeed) * 100;
  }

  // 일관성 계산 (한 달 동안 주 3회 이상)
  private calculateConsistency(records: Record[]): number {
    if (records.length === 0) return 0;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentRecords = records.filter(
      (r) => new Date(r.date) >= oneMonthAgo,
    );

    // 주별 훈련 횟수 계산
    const weeklyCounts = new Map<number, number>();

    recentRecords.forEach((record) => {
      const date = new Date(record.date);
      const weekNumber = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
      weeklyCounts.set(weekNumber, (weeklyCounts.get(weekNumber) || 0) + 1);
    });

    // 주 3회 이상인 주의 수
    let consistentWeeks = 0;
    weeklyCounts.forEach((count) => {
      if (count >= 3) consistentWeeks++;
    });

    return consistentWeeks;
  }

  // 목표 달성 계산
  private calculateGoalAchievements(records: Record[]): number {
    if (records.length === 0) return 0;

    const goals = new Set(records.map((r) => r.goal));
    return goals.size;
  }

  // 성취 통계
  async getAchievementStats(userId: number) {
    const achievements = await this.getUserAchievements(userId);
    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
    const totalCount = achievements.length;

    const levelStats = {
      bronze: achievements.filter(
        (a) => a.level === AchievementLevel.BRONZE && a.isUnlocked,
      ).length,
      silver: achievements.filter(
        (a) => a.level === AchievementLevel.SILVER && a.isUnlocked,
      ).length,
      gold: achievements.filter(
        (a) => a.level === AchievementLevel.GOLD && a.isUnlocked,
      ).length,
      platinum: achievements.filter(
        (a) => a.level === AchievementLevel.PLATINUM && a.isUnlocked,
      ).length,
    };

    return {
      totalAchievements: totalCount,
      unlockedAchievements: unlockedCount,
      completionRate: totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0,
      levelStats,
    };
  }
}
