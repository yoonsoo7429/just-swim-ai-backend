import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, GoalType, GoalStatus } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Record } from '../records/entities/record.entity';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    @InjectRepository(Record)
    private recordsRepository: Repository<Record>,
  ) {}

  async create(createGoalDto: CreateGoalDto, userId: number): Promise<Goal> {
    const goal = this.goalsRepository.create({
      ...createGoalDto,
      userId,
    });

    return this.goalsRepository.save(goal);
  }

  async findAll(userId: number): Promise<Goal[]> {
    return this.goalsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('목표를 찾을 수 없습니다.');
    }

    return goal;
  }

  async update(
    id: number,
    updateGoalDto: UpdateGoalDto,
    userId: number,
  ): Promise<Goal> {
    const goal = await this.findOne(id, userId);

    Object.assign(goal, updateGoalDto);

    return this.goalsRepository.save(goal);
  }

  async remove(id: number, userId: number): Promise<void> {
    const goal = await this.findOne(id, userId);
    await this.goalsRepository.remove(goal);
  }

  async updateGoalProgress(userId: number): Promise<void> {
    const activeGoals = await this.goalsRepository.find({
      where: { userId, status: GoalStatus.ACTIVE },
    });

    const userRecords = await this.recordsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    for (const goal of activeGoals) {
      const currentValue = this.calculateCurrentValue(goal, userRecords);
      const progress = this.calculateProgress(goal, currentValue);

      goal.currentValue = currentValue;
      goal.progress = progress;

      // 목표 달성 확인
      if (progress >= 100 && !goal.isCompleted) {
        goal.isCompleted = true;
        goal.status = GoalStatus.COMPLETED;
        goal.completedAt = new Date();
      }

      await this.goalsRepository.save(goal);
    }
  }

  private calculateCurrentValue(goal: Goal, records: Record[]): number {
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const now = new Date();

    // 목표 기간 내의 기록만 필터링
    const relevantRecords = records.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    switch (goal.type) {
      case GoalType.DISTANCE:
        return relevantRecords.reduce(
          (sum, record) => sum + Number(record.distance),
          0,
        );

      case GoalType.TIME:
        return relevantRecords.reduce(
          (sum, record) => sum + record.duration,
          0,
        );

      case GoalType.FREQUENCY:
        return relevantRecords.length;

      case GoalType.SPEED:
        if (relevantRecords.length === 0) return 0;
        const totalDistance = relevantRecords.reduce(
          (sum, record) => sum + Number(record.distance),
          0,
        );
        const totalTime = relevantRecords.reduce(
          (sum, record) => sum + record.duration,
          0,
        );
        return totalTime > 0 ? totalDistance / totalTime : 0;

      case GoalType.STYLE_MASTERY:
        const uniqueStyles = new Set(
          relevantRecords.map((record) => record.style),
        );
        return uniqueStyles.size;

      case GoalType.STREAK:
        return this.calculateStreak(relevantRecords);

      default:
        return 0;
    }
  }

  private calculateProgress(goal: Goal, currentValue: number): number {
    if (goal.targetValue <= 0) return 0;
    const progress = (currentValue / goal.targetValue) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  private calculateStreak(records: Record[]): number {
    if (records.length === 0) return 0;

    const sortedRecords = records.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedRecords.length; i++) {
      const prevDate = new Date(sortedRecords[i - 1].date);
      const currDate = new Date(sortedRecords[i].date);
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }

  async getGoalStats(userId: number) {
    const goals = await this.findAll(userId);

    const totalGoals = goals.length;
    const activeGoals = goals.filter(
      (g) => g.status === GoalStatus.ACTIVE,
    ).length;
    const completedGoals = goals.filter(
      (g) => g.status === GoalStatus.COMPLETED,
    ).length;
    const failedGoals = goals.filter(
      (g) => g.status === GoalStatus.FAILED,
    ).length;

    const completionRate =
      totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const goalsByType = goals.reduce(
      (acc, goal) => {
        acc[goal.type] = (acc[goal.type] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      failedGoals,
      completionRate: Math.round(completionRate * 100) / 100,
      goalsByType,
    };
  }
}
