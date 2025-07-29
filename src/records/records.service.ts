import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateRecordDto } from './dto/create-record.dto';
import { Record } from './entities/record.entity';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Record)
    private recordsRepository: Repository<Record>,
  ) {}

  async create(
    createRecordDto: CreateRecordDto,
    userId: number,
  ): Promise<Record> {
    try {
      const record = this.recordsRepository.create({
        ...createRecordDto,
        userId,
        frequencyPerWeek: createRecordDto.frequency_per_week,
      });

      const savedRecord = await this.recordsRepository.save(record);

      // 훈련 세션 분석 결과를 포함하여 반환
      const analysis = await this.analyzeTrainingSession(savedRecord, userId);

      return {
        ...savedRecord,
        analysis,
      } as any;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('기록 저장 중 오류가 발생했습니다.');
    }
  }

  async findByUserId(userId: number): Promise<Record[]> {
    try {
      return await this.recordsRepository.find({
        where: { userId },
        relations: ['user'],
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
        relations: ['user'],
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
        weeklyStats: null,
        personalBests: null,
      };

      // 개인 최고 기록 확인
      const personalBests = await this.getPersonalBests(userId);
      analysis.personalBests = personalBests;

      // 새로운 기록인지 확인
      const isDistanceRecord = Number(record.distance) > personalBests.distance;
      const isTimeRecord = record.duration > personalBests.duration;
      const isSpeedRecord =
        Number(record.distance) / record.duration > personalBests.speed;

      if (isDistanceRecord) {
        analysis.isNewRecord = true;
        analysis.recordType = 'distance';
      } else if (isTimeRecord) {
        analysis.isNewRecord = true;
        analysis.recordType = 'duration';
      } else if (isSpeedRecord) {
        analysis.isNewRecord = true;
        analysis.recordType = 'speed';
      }

      // 이번 주 통계
      analysis.weeklyStats = await this.getWeeklyStats(userId);

      // 개선도 계산 (이전 훈련과 비교)
      analysis.improvement = await this.calculateImprovement(record, userId);

      return analysis;
    } catch (error) {
      console.error('훈련 세션 분석 중 오류:', error);
      return {
        isNewRecord: false,
        recordType: '',
        improvement: null,
        weeklyStats: null,
        personalBests: null,
      };
    }
  }

  // 개인 최고 기록 조회
  async getPersonalBests(userId: number) {
    try {
      const records = await this.recordsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      if (records.length === 0) {
        return {
          distance: 0,
          duration: 0,
          speed: 0,
        };
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
      return {
        distance: 0,
        duration: 0,
        speed: 0,
      };
    }
  }

  // 이번 주 통계
  async getWeeklyStats(userId: number) {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // TypeORM의 Between을 사용하여 날짜 범위 쿼리
      const weeklyRecords = await this.recordsRepository.find({
        where: {
          userId,
          date: Between(
            startOfWeek.toISOString().split('T')[0],
            endOfWeek.toISOString().split('T')[0],
          ),
        },
      });

      const totalDistance = weeklyRecords.reduce(
        (sum, record) => sum + Number(record.distance),
        0,
      );
      const totalTime = weeklyRecords.reduce(
        (sum, record) => sum + record.duration,
        0,
      );
      const sessionCount = weeklyRecords.length;

      return {
        totalDistance,
        totalTime,
        sessionCount,
        averageDistance: sessionCount > 0 ? totalDistance / sessionCount : 0,
        averageTime: sessionCount > 0 ? totalTime / sessionCount : 0,
      };
    } catch (error) {
      console.error('주간 통계 조회 중 오류:', error);
      return {
        totalDistance: 0,
        totalTime: 0,
        sessionCount: 0,
        averageDistance: 0,
        averageTime: 0,
      };
    }
  }

  // 개선도 계산
  async calculateImprovement(currentRecord: Record, userId: number) {
    try {
      const previousRecords = await this.recordsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 1,
        take: 5, // 최근 5개 기록과 비교
      });

      if (previousRecords.length === 0) {
        return {
          distanceImprovement: 0,
          timeImprovement: 0,
          speedImprovement: 0,
          isFirstRecord: true,
        };
      }

      const avgPreviousDistance =
        previousRecords.reduce((sum, r) => sum + Number(r.distance), 0) /
        previousRecords.length;
      const avgPreviousTime =
        previousRecords.reduce((sum, r) => sum + r.duration, 0) /
        previousRecords.length;
      const avgPreviousSpeed =
        previousRecords.reduce(
          (sum, r) => sum + Number(r.distance) / r.duration,
          0,
        ) / previousRecords.length;

      const currentSpeed =
        Number(currentRecord.distance) / currentRecord.duration;

      return {
        distanceImprovement:
          avgPreviousDistance > 0
            ? ((Number(currentRecord.distance) - avgPreviousDistance) /
                avgPreviousDistance) *
              100
            : 0,
        timeImprovement:
          avgPreviousTime > 0
            ? ((currentRecord.duration - avgPreviousTime) / avgPreviousTime) *
              100
            : 0,
        speedImprovement:
          avgPreviousSpeed > 0
            ? ((currentSpeed - avgPreviousSpeed) / avgPreviousSpeed) * 100
            : 0,
        isFirstRecord: false,
      };
    } catch (error) {
      console.error('개선도 계산 중 오류:', error);
      return {
        distanceImprovement: 0,
        timeImprovement: 0,
        speedImprovement: 0,
        isFirstRecord: false,
      };
    }
  }

  // 사용자 통계 요약
  async getUserStats(userId: number) {
    try {
      const records = await this.recordsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      if (records.length === 0) {
        return {
          totalRecords: 0,
          totalDistance: 0,
          totalTime: 0,
          averageDistance: 0,
          averageTime: 0,
          personalBests: null,
          weeklyStats: null,
        };
      }

      const totalDistance = records.reduce(
        (sum, r) => sum + Number(r.distance),
        0,
      );
      const totalTime = records.reduce((sum, r) => sum + r.duration, 0);
      const personalBests = await this.getPersonalBests(userId);
      const weeklyStats = await this.getWeeklyStats(userId);

      return {
        totalRecords: records.length,
        totalDistance,
        totalTime,
        averageDistance: totalDistance / records.length,
        averageTime: totalTime / records.length,
        personalBests,
        weeklyStats,
      };
    } catch (error) {
      console.error('사용자 통계 조회 중 오류:', error);
      throw new BadRequestException('통계 조회 중 오류가 발생했습니다.');
    }
  }

  // 영법별 통계
  async getStyleStats(userId: number) {
    try {
      const records = await this.recordsRepository.find({
        where: { userId },
      });

      const styleStats = {};
      const styles = ['freestyle', 'backstroke', 'breaststroke', 'butterfly'];

      styles.forEach((style) => {
        const styleRecords = records.filter((r) => r.style === style);
        if (styleRecords.length > 0) {
          const totalDistance = styleRecords.reduce(
            (sum, r) => sum + Number(r.distance),
            0,
          );
          const totalTime = styleRecords.reduce(
            (sum, r) => sum + r.duration,
            0,
          );

          styleStats[style] = {
            count: styleRecords.length,
            totalDistance,
            totalTime,
            averageDistance: totalDistance / styleRecords.length,
            averageTime: totalTime / styleRecords.length,
            bestDistance: Math.max(
              ...styleRecords.map((r) => Number(r.distance)),
            ),
            bestTime: Math.max(...styleRecords.map((r) => r.duration)),
          };
        } else {
          styleStats[style] = {
            count: 0,
            totalDistance: 0,
            totalTime: 0,
            averageDistance: 0,
            averageTime: 0,
            bestDistance: 0,
            bestTime: 0,
          };
        }
      });

      return styleStats;
    } catch (error) {
      console.error('영법별 통계 조회 중 오류:', error);
      throw new BadRequestException('영법별 통계 조회 중 오류가 발생했습니다.');
    }
  }
}
