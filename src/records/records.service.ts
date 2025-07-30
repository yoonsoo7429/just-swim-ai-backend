import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateRecordDto } from './dto/create-record.dto';
import { Record } from './entities/record.entity';
import { SwimSegment } from './entities/swim-segment.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { Achievement } from '../achievements/entities/achievement.entity';
import { GoalsService } from '../goals/goals.service';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Record)
    private recordsRepository: Repository<Record>,
    @InjectRepository(SwimSegment)
    private swimSegmentsRepository: Repository<SwimSegment>,
    private achievementsService: AchievementsService,
    private goalsService: GoalsService,
  ) {}

  async create(
    createRecordDto: CreateRecordDto,
    userId: number,
  ): Promise<Record & { analysis: any; newAchievements: Achievement[] }> {
    try {
      // 세그먼트가 있는 경우 상세 기록으로 처리
      if (createRecordDto.segments && createRecordDto.segments.length > 0) {
        return this.createDetailedRecord(createRecordDto, userId);
      }

      // 기본 기록 생성
      const record = this.recordsRepository.create({
        ...createRecordDto,
        userId,
        frequencyPerWeek: createRecordDto.frequency_per_week,
      });

      const savedRecord = await this.recordsRepository.save(record);

      // 훈련 세션 분석 결과를 포함하여 반환
      const analysis = await this.analyzeTrainingSession(savedRecord, userId);

      // 성취 확인 및 생성
      const newAchievements =
        await this.achievementsService.checkAndCreateAchievements(userId);

      // 목표 진행률 업데이트
      await this.goalsService.updateGoalProgress(userId);

      return {
        ...savedRecord,
        analysis,
        newAchievements,
      } as Record & { analysis: any; newAchievements: Achievement[] };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('기록 저장 중 오류가 발생했습니다.');
    }
  }

  private async createDetailedRecord(
    createRecordDto: CreateRecordDto,
    userId: number,
  ): Promise<Record & { analysis: any; newAchievements: Achievement[] }> {
    // 총 거리, 시간, 랩 수 계산
    const totalDistance = createRecordDto.segments!.reduce(
      (sum, segment) => sum + segment.distance,
      0,
    );
    const totalDuration = createRecordDto.segments!.reduce(
      (sum, segment) => sum + segment.duration,
      0,
    );
    const totalLaps = createRecordDto.segments!.reduce(
      (sum, segment) => sum + segment.laps,
      0,
    );

    // 평균 페이스 계산 (100m당 분 단위)
    const averagePace =
      totalDistance > 0 ? (totalDuration / totalDistance) * 100 : 0;

    // 메인 영법 결정 (가장 긴 거리의 영법)
    const mainStyle = createRecordDto.segments!.reduce((prev, current) =>
      prev.distance > current.distance ? prev : current,
    ).style;

    // 기록 생성
    const record = this.recordsRepository.create({
      userId,
      date: createRecordDto.date,
      distance: totalDistance,
      style: mainStyle,
      duration: totalDuration,
      frequencyPerWeek: createRecordDto.frequency_per_week,
      goal: createRecordDto.goal,
      // 상세 정보
      startTime: createRecordDto.startTime,
      endTime: createRecordDto.endTime,
      poolLength: createRecordDto.poolLength,
      averagePace,
      averageHeartRate: createRecordDto.averageHeartRate,
      totalLaps,
      location: createRecordDto.location,
      notes: createRecordDto.notes,
    });

    const savedRecord = await this.recordsRepository.save(record);

    // 세그먼트 생성 및 저장
    const segments = createRecordDto.segments!.map((segmentDto) => {
      const segment = this.swimSegmentsRepository.create({
        ...segmentDto,
        recordId: savedRecord.id,
      });
      return segment;
    });

    await this.swimSegmentsRepository.save(segments);

    // 훈련 세션 분석
    const analysis = await this.analyzeTrainingSession(savedRecord, userId);

    // 성취 확인 및 생성
    const newAchievements =
      await this.achievementsService.checkAndCreateAchievements(userId);

    // 목표 진행률 업데이트
    await this.goalsService.updateGoalProgress(userId);

    return {
      ...savedRecord,
      segments,
      analysis,
      newAchievements,
    } as Record & { analysis: any; newAchievements: Achievement[] };
  }

  async findByUserId(userId: number): Promise<Record[]> {
    try {
      return await this.recordsRepository.find({
        where: { userId },
        relations: ['user', 'segments'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new BadRequestException('기록 조회 중 오류가 발생했습니다.');
    }
  }

  async findById(id: number): Promise<Record | null> {
    try {
      const record = await this.recordsRepository.findOne({
        where: { id },
        relations: ['user', 'segments'],
      });

      if (!record) {
        throw new NotFoundException('기록을 찾을 수 없습니다.');
      }

      return record;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('기록 조회 중 오류가 발생했습니다.');
    }
  }

  // 훈련 세션 분석
  async analyzeTrainingSession(record: Record, userId: number) {
    try {
      const analysis: any = {
        isNewRecord: false,
        recordType: '',
        improvement: null,
      };

      // 개인 최고 기록 확인
      const personalBests = await this.getPersonalBests(userId);
      const isNewDistanceRecord =
        record.distance > (personalBests.distance || 0);
      const isNewDurationRecord =
        record.duration > (personalBests.duration || 0);
      const isNewSpeedRecord =
        record.distance / record.duration > (personalBests.speed || 0);

      if (isNewDistanceRecord || isNewDurationRecord || isNewSpeedRecord) {
        analysis.isNewRecord = true;
        if (isNewDistanceRecord) analysis.recordType = 'distance';
        else if (isNewDurationRecord) analysis.recordType = 'duration';
        else if (isNewSpeedRecord) analysis.recordType = 'speed';
      }

      // 이전 기록과의 개선도 계산
      const improvement = await this.calculateImprovement(record, userId);
      analysis.improvement = improvement;

      return analysis;
    } catch (error) {
      console.error('훈련 세션 분석 중 오류:', error);
      return {
        isNewRecord: false,
        recordType: '',
        improvement: null,
      };
    }
  }

  async getPersonalBests(userId: number) {
    try {
      const records = await this.recordsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      if (records.length === 0) {
        return { distance: 0, duration: 0, speed: 0 };
      }

      const maxDistance = Math.max(...records.map((r) => Number(r.distance)));
      const maxDuration = Math.max(...records.map((r) => r.duration));
      const maxSpeed = Math.max(
        ...records.map((r) => Number(r.distance) / r.duration),
      );

      return {
        distance: maxDistance,
        duration: maxDuration,
        speed: maxSpeed,
      };
    } catch (error) {
      console.error('개인 최고 기록 조회 중 오류:', error);
      return { distance: 0, duration: 0, speed: 0 };
    }
  }

  async getWeeklyStats(userId: number) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const startDateStr = sevenDaysAgo.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // 모든 기록을 가져와서 서버에서 필터링
      const allRecords = await this.recordsRepository.find({
        where: { userId },
      });

      const weeklyRecords = allRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= sevenDaysAgo && recordDate <= endDate;
      });

      const totalDistance = weeklyRecords.reduce(
        (sum, r) => sum + Number(r.distance),
        0,
      );
      const totalTime = weeklyRecords.reduce((sum, r) => sum + r.duration, 0);
      const sessionCount = weeklyRecords.length;
      const averageTime = sessionCount > 0 ? totalTime / sessionCount : 0;

      return {
        totalDistance,
        totalTime,
        sessionCount,
        averageTime,
      };
    } catch (error) {
      console.error('주간 통계 조회 중 오류:', error);
      return {
        totalDistance: 0,
        totalTime: 0,
        sessionCount: 0,
        averageTime: 0,
      };
    }
  }

  async calculateImprovement(currentRecord: Record, userId: number) {
    try {
      const previousRecords = await this.recordsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 1,
        take: 5,
      });

      if (previousRecords.length === 0) {
        return {
          isFirstRecord: true,
          distanceImprovement: 0,
          timeImprovement: 0,
          speedImprovement: 0,
        };
      }

      const avgPreviousDistance =
        previousRecords.reduce((sum, r) => sum + Number(r.distance), 0) /
        previousRecords.length;
      const avgPreviousDuration =
        previousRecords.reduce((sum, r) => sum + r.duration, 0) /
        previousRecords.length;
      const avgPreviousSpeed = avgPreviousDistance / avgPreviousDuration;

      const currentSpeed =
        Number(currentRecord.distance) / currentRecord.duration;

      const distanceImprovement =
        ((Number(currentRecord.distance) - avgPreviousDistance) /
          avgPreviousDistance) *
        100;
      const timeImprovement =
        ((currentRecord.duration - avgPreviousDuration) / avgPreviousDuration) *
        100;
      const speedImprovement =
        ((currentSpeed - avgPreviousSpeed) / avgPreviousSpeed) * 100;

      return {
        isFirstRecord: false,
        distanceImprovement,
        timeImprovement,
        speedImprovement,
      };
    } catch (error) {
      console.error('개선도 계산 중 오류:', error);
      return {
        isFirstRecord: true,
        distanceImprovement: 0,
        timeImprovement: 0,
        speedImprovement: 0,
      };
    }
  }

  async getUserStats(userId: number) {
    try {
      const records = await this.recordsRepository.find({
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      if (records.length === 0) {
        return {
          totalDistance: 0,
          totalTime: 0,
          totalRecords: 0,
          personalBests: { distance: 0, duration: 0, speed: 0 },
          weeklyStats: {
            totalDistance: 0,
            totalTime: 0,
            sessionCount: 0,
            averageTime: 0,
          },
        };
      }

      const totalDistance = records.reduce(
        (sum, r) => sum + Number(r.distance),
        0,
      );
      const totalTime = records.reduce((sum, r) => sum + r.duration, 0);
      const totalRecords = records.length;

      const personalBests = await this.getPersonalBests(userId);
      const weeklyStats = await this.getWeeklyStats(userId);

      return {
        totalDistance,
        totalTime,
        totalRecords,
        personalBests,
        weeklyStats,
      };
    } catch (error) {
      console.error('사용자 통계 조회 중 오류:', error);
      return {
        totalDistance: 0,
        totalTime: 0,
        totalRecords: 0,
        personalBests: { distance: 0, duration: 0, speed: 0 },
        weeklyStats: {
          totalDistance: 0,
          totalTime: 0,
          sessionCount: 0,
          averageTime: 0,
        },
      };
    }
  }

  async getStyleStats(userId: number) {
    try {
      const records = await this.recordsRepository.find({
        where: { userId },
      });

      const styleStats: { [key: string]: any } = {};

      records.forEach((record) => {
        const style = record.style;
        if (!styleStats[style]) {
          styleStats[style] = {
            totalDistance: 0,
            totalTime: 0,
            count: 0,
          };
        }

        styleStats[style].totalDistance += Number(record.distance);
        styleStats[style].totalTime += record.duration;
        styleStats[style].count += 1;
      });

      return styleStats;
    } catch (error) {
      console.error('영법별 통계 조회 중 오류:', error);
      return {};
    }
  }

  async getAnalysis(userId: number) {
    try {
      const records = await this.recordsRepository.find({
        where: { userId },
        relations: ['segments'],
        order: { createdAt: 'DESC' },
      });

      if (records.length === 0) {
        return {
          overallImprovement: 0,
          complexTrainingRatio: 0,
          averageSessionDuration: 0,
          intensityAnalysis: {
            lowIntensity: 0,
            mediumIntensity: 0,
            highIntensity: 0,
            averageHeartRate: 0,
            intensityTrend: 'stable',
          },
          styleAnalysis: [],
        };
      }

      // 전체 개선도 계산
      const recentRecords = records.slice(0, 5);
      const olderRecords = records.slice(5, 10);

      let overallImprovement = 0;
      if (olderRecords.length > 0) {
        const recentAvgSpeed =
          recentRecords.reduce(
            (sum, r) => sum + Number(r.distance) / r.duration,
            0,
          ) / recentRecords.length;
        const olderAvgSpeed =
          olderRecords.reduce(
            (sum, r) => sum + Number(r.distance) / r.duration,
            0,
          ) / olderRecords.length;
        overallImprovement =
          olderAvgSpeed > 0
            ? ((recentAvgSpeed - olderAvgSpeed) / olderAvgSpeed) * 100
            : 0;
      }

      // 복합 훈련 비율 (세그먼트가 있는 기록)
      const complexSessions = records.filter(
        (r) => r.segments && r.segments.length > 1,
      );
      const complexTrainingRatio =
        records.length > 0
          ? (complexSessions.length / records.length) * 100
          : 0;

      // 평균 세션 시간
      const averageSessionDuration =
        records.reduce((sum, r) => sum + r.duration, 0) / records.length;

      // 강도 분석
      const recordsWithHeartRate = records.filter((r) => r.averageHeartRate);
      const intensityAnalysis = {
        lowIntensity: 0,
        mediumIntensity: 0,
        highIntensity: 0,
        averageHeartRate: 0,
        intensityTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      };

      if (recordsWithHeartRate.length > 0) {
        const avgHeartRate =
          recordsWithHeartRate.reduce(
            (sum, r) => sum + (r.averageHeartRate || 0),
            0,
          ) / recordsWithHeartRate.length;
        intensityAnalysis.averageHeartRate = avgHeartRate;

        const lowCount = recordsWithHeartRate.filter(
          (r) => (r.averageHeartRate || 0) < 130,
        ).length;
        const mediumCount = recordsWithHeartRate.filter(
          (r) =>
            (r.averageHeartRate || 0) >= 130 && (r.averageHeartRate || 0) < 160,
        ).length;
        const highCount = recordsWithHeartRate.filter(
          (r) => (r.averageHeartRate || 0) >= 160,
        ).length;

        intensityAnalysis.lowIntensity =
          (lowCount / recordsWithHeartRate.length) * 100;
        intensityAnalysis.mediumIntensity =
          (mediumCount / recordsWithHeartRate.length) * 100;
        intensityAnalysis.highIntensity =
          (highCount / recordsWithHeartRate.length) * 100;

        // 강도 트렌드
        if (recordsWithHeartRate.length >= 2) {
          const recentAvg =
            recordsWithHeartRate
              .slice(0, 3)
              .reduce((sum, r) => sum + (r.averageHeartRate || 0), 0) /
            Math.min(3, recordsWithHeartRate.length);
          const olderAvg =
            recordsWithHeartRate
              .slice(3, 6)
              .reduce((sum, r) => sum + (r.averageHeartRate || 0), 0) /
            Math.min(3, recordsWithHeartRate.length - 3);

          if (olderAvg > 0) {
            const trend = ((recentAvg - olderAvg) / olderAvg) * 100;
            if (trend > 5) intensityAnalysis.intensityTrend = 'increasing';
            else if (trend < -5)
              intensityAnalysis.intensityTrend = 'decreasing';
          }
        }
      }

      // 영법별 분석
      const styleAnalysis = Object.entries(
        await this.getStyleStats(userId),
      ).map(([style, stats]) => {
        const styleRecords = records.filter((r) => r.style === style);
        const recentStyleRecords = styleRecords.slice(0, 3);
        const olderStyleRecords = styleRecords.slice(3, 6);

        let paceImprovement = 0;
        let distanceImprovement = 0;

        if (olderStyleRecords.length > 0 && recentStyleRecords.length > 0) {
          const recentAvgPace =
            recentStyleRecords.reduce(
              (sum, r) => sum + (r.averagePace || 0),
              0,
            ) / recentStyleRecords.length;
          const olderAvgPace =
            olderStyleRecords.reduce(
              (sum, r) => sum + (r.averagePace || 0),
              0,
            ) / olderStyleRecords.length;
          paceImprovement =
            olderAvgPace > 0
              ? ((olderAvgPace - recentAvgPace) / olderAvgPace) * 100
              : 0;

          const recentAvgDistance =
            recentStyleRecords.reduce((sum, r) => sum + Number(r.distance), 0) /
            recentStyleRecords.length;
          const olderAvgDistance =
            olderStyleRecords.reduce((sum, r) => sum + Number(r.distance), 0) /
            olderStyleRecords.length;
          distanceImprovement =
            olderAvgDistance > 0
              ? ((recentAvgDistance - olderAvgDistance) / olderAvgDistance) *
                100
              : 0;
        }

        return {
          style,
          totalDistance: stats.totalDistance,
          totalSessions: stats.count,
          averagePace: stats.totalTime / (stats.totalDistance / 100),
          averageHeartRate:
            styleRecords.filter((r) => r.averageHeartRate).length > 0
              ? styleRecords
                  .filter((r) => r.averageHeartRate)
                  .reduce((sum, r) => sum + (r.averageHeartRate || 0), 0) /
                styleRecords.filter((r) => r.averageHeartRate).length
              : undefined,
          improvement: {
            pace: paceImprovement,
            distance: distanceImprovement,
          },
        };
      });

      return {
        overallImprovement,
        complexTrainingRatio,
        averageSessionDuration,
        intensityAnalysis,
        styleAnalysis,
      };
    } catch (error) {
      console.error('상세 분석 조회 중 오류:', error);
      return {
        overallImprovement: 0,
        complexTrainingRatio: 0,
        averageSessionDuration: 0,
        intensityAnalysis: {
          lowIntensity: 0,
          mediumIntensity: 0,
          highIntensity: 0,
          averageHeartRate: 0,
          intensityTrend: 'stable',
        },
        styleAnalysis: [],
      };
    }
  }
}
