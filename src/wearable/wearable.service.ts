import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WearableConnection,
  WearableProvider,
  ConnectionStatus,
} from './entities/wearable-connection.entity';
import {
  WearableData,
  ActivityType,
  SwimStyle,
} from './entities/wearable-data.entity';
import {
  ConnectWearableDto,
  SyncWearableDto,
  WearableSyncResultDto,
  WearableStatsDto,
} from './dto/wearable.dto';
import { RecordsService } from '../records/records.service';
import { CreateRecordDto } from '../records/dto/create-record.dto';

@Injectable()
export class WearableService {
  private readonly logger = new Logger(WearableService.name);

  constructor(
    @InjectRepository(WearableConnection)
    private wearableConnectionRepository: Repository<WearableConnection>,
    @InjectRepository(WearableData)
    private wearableDataRepository: Repository<WearableData>,
    private recordsService: RecordsService,
  ) {}

  // 웨어러블 기기 연결
  async connectWearable(
    userId: number,
    connectDto: ConnectWearableDto,
  ): Promise<WearableConnection> {
    const {
      provider,
      authorizationCode,
      accessToken,
      refreshToken,
      externalUserId,
    } = connectDto;

    // 기존 연결 확인
    const existingConnection = await this.wearableConnectionRepository.findOne({
      where: { userId, provider },
    });

    if (existingConnection) {
      // 기존 연결 업데이트
      existingConnection.accessToken = accessToken;
      existingConnection.refreshToken = refreshToken;
      if (externalUserId) {
        existingConnection.externalUserId = externalUserId;
      }
      existingConnection.status = ConnectionStatus.CONNECTED;
      existingConnection.lastSyncAt = new Date();

      return this.wearableConnectionRepository.save(existingConnection);
    }

    // 새 연결 생성
    const connection = this.wearableConnectionRepository.create({
      userId,
      provider,
      externalUserId: externalUserId || `user_${userId}_${provider}`,
      accessToken,
      refreshToken,
      status: ConnectionStatus.CONNECTED,
      lastSyncAt: new Date(),
    });

    return this.wearableConnectionRepository.save(connection);
  }

  // 웨어러블 기기 연결 해제
  async disconnectWearable(
    userId: number,
    provider: WearableProvider,
  ): Promise<void> {
    const connection = await this.wearableConnectionRepository.findOne({
      where: { userId, provider },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    connection.status = ConnectionStatus.DISCONNECTED;
    await this.wearableConnectionRepository.save(connection);
  }

  // 사용자의 웨어러블 기기 연결 목록 조회
  async getUserConnections(userId: number): Promise<WearableConnection[]> {
    return this.wearableConnectionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // 웨어러블 데이터 동기화
  async syncWearableData(
    userId: number,
    syncDto: SyncWearableDto,
  ): Promise<WearableSyncResultDto> {
    const { provider, startDate, endDate } = syncDto;

    const connection = await this.wearableConnectionRepository.findOne({
      where: { userId, provider },
    });

    if (!connection || connection.status !== ConnectionStatus.CONNECTED) {
      throw new BadRequestException('Wearable device not connected');
    }

    try {
      // 각 제공자별로 데이터 동기화
      const syncResult = await this.syncDataFromProvider(
        connection,
        startDate,
        endDate,
      );

      // 연결 상태 업데이트
      connection.lastSyncAt = new Date();
      await this.wearableConnectionRepository.save(connection);

      return syncResult;
    } catch (error) {
      this.logger.error(`Failed to sync data from ${provider}:`, error);
      connection.status = ConnectionStatus.ERROR;
      await this.wearableConnectionRepository.save(connection);

      throw new BadRequestException(`Failed to sync data from ${provider}`);
    }
  }

  // 제공자별 데이터 동기화
  private async syncDataFromProvider(
    connection: WearableConnection,
    startDate?: string,
    endDate?: string,
  ): Promise<WearableSyncResultDto> {
    const { provider, userId } = connection;
    let newActivities = 0;
    let updatedActivities = 0;
    const errors: string[] = [];

    try {
      switch (provider) {
        case WearableProvider.APPLE_HEALTH:
          await this.syncAppleHealthData(connection, startDate, endDate);
          break;
        case WearableProvider.GOOGLE_FIT:
          await this.syncGoogleFitData(connection, startDate, endDate);
          break;
        case WearableProvider.GARMIN_CONNECT:
          await this.syncGarminData(connection, startDate, endDate);
          break;
        case WearableProvider.FITBIT:
          await this.syncFitbitData(connection, startDate, endDate);
          break;
        case WearableProvider.STRAVA:
          await this.syncStravaData(connection, startDate, endDate);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // 동기화된 데이터를 기록으로 변환
      const unprocessedData = await this.wearableDataRepository.find({
        where: { userId, provider, isProcessed: false },
      });

      for (const data of unprocessedData) {
        try {
          await this.convertToRecord(data);
          data.isProcessed = true;
          data.processedAt = new Date();
          await this.wearableDataRepository.save(data);
          newActivities++;
        } catch (error) {
          errors.push(
            `Failed to process activity ${data.externalActivityId}: ${error.message}`,
          );
        }
      }

      const totalActivities = await this.wearableDataRepository.count({
        where: { userId, provider },
      });

      return {
        provider,
        totalActivities,
        newActivities,
        updatedActivities,
        errors,
        syncTime: new Date(),
      };
    } catch (error) {
      errors.push(`Sync failed: ${error.message}`);
      throw error;
    }
  }

  // Apple Health 데이터 동기화
  private async syncAppleHealthData(
    connection: WearableConnection,
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    // Apple Health API 연동 구현
    // 실제 구현에서는 Apple HealthKit API를 사용
    this.logger.log('Syncing Apple Health data...');

    // 임시 구현 - 실제로는 Apple Health API 호출
    const mockData = this.generateMockSwimmingData(
      connection.userId,
      WearableProvider.APPLE_HEALTH,
    );
    await this.saveWearableData(mockData);
  }

  // Google Fit 데이터 동기화
  private async syncGoogleFitData(
    connection: WearableConnection,
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    // Google Fit API 연동 구현
    this.logger.log('Syncing Google Fit data...');

    // 임시 구현 - 실제로는 Google Fit API 호출
    const mockData = this.generateMockSwimmingData(
      connection.userId,
      WearableProvider.GOOGLE_FIT,
    );
    await this.saveWearableData(mockData);
  }

  // Garmin Connect 데이터 동기화
  private async syncGarminData(
    connection: WearableConnection,
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    // Garmin Connect API 연동 구현
    this.logger.log('Syncing Garmin Connect data...');

    // 임시 구현 - 실제로는 Garmin Connect API 호출
    const mockData = this.generateMockSwimmingData(
      connection.userId,
      WearableProvider.GARMIN_CONNECT,
    );
    await this.saveWearableData(mockData);
  }

  // Fitbit 데이터 동기화
  private async syncFitbitData(
    connection: WearableConnection,
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    // Fitbit API 연동 구현
    this.logger.log('Syncing Fitbit data...');

    // 임시 구현 - 실제로는 Fitbit API 호출
    const mockData = this.generateMockSwimmingData(
      connection.userId,
      WearableProvider.FITBIT,
    );
    await this.saveWearableData(mockData);
  }

  // Strava 데이터 동기화
  private async syncStravaData(
    connection: WearableConnection,
    startDate?: string,
    endDate?: string,
  ): Promise<void> {
    // Strava API 연동 구현
    this.logger.log('Syncing Strava data...');

    // 임시 구현 - 실제로는 Strava API 호출
    const mockData = this.generateMockSwimmingData(
      connection.userId,
      WearableProvider.STRAVA,
    );
    await this.saveWearableData(mockData);
  }

  // 웨어러블 데이터 저장
  private async saveWearableData(
    data: Partial<WearableData>,
  ): Promise<WearableData> {
    const wearableData = this.wearableDataRepository.create(data);
    return this.wearableDataRepository.save(wearableData);
  }

  // 웨어러블 데이터를 기록으로 변환
  private async convertToRecord(wearableData: WearableData): Promise<void> {
    if (wearableData.activityType !== ActivityType.SWIMMING) {
      return; // 수영 데이터만 처리
    }

    // duration을 초에서 분으로 변환
    const durationInMinutes = Math.round(wearableData.duration / 60);

    const recordData: CreateRecordDto = {
      date: wearableData.startTime.toISOString().split('T')[0],
      startTime: wearableData.startTime.toISOString(),
      endTime: wearableData.endTime.toISOString(),
      distance: wearableData.distance || 0,
      duration: durationInMinutes,
      style: wearableData.swimStyle || SwimStyle.UNKNOWN,
      averageHeartRate: wearableData.averageHeartRate,
      maxHeartRate: wearableData.maxHeartRate,
      calories: wearableData.calories,
      averageSpeed: wearableData.averageSpeed,
      maxSpeed: wearableData.maxSpeed,
      strokeCount: wearableData.strokeCount,
      strokeRate: wearableData.strokeRate,
      segments: wearableData.segments || [],
      dataSource: 'wearable',
      wearableProvider: wearableData.provider || 'unknown',
      notes: `Imported from ${wearableData.provider}`,
    };

    await this.recordsService.create(recordData, wearableData.userId);
  }

  // 웨어러블 통계 조회
  async getWearableStats(
    userId: number,
    provider: WearableProvider,
  ): Promise<WearableStatsDto> {
    const data = await this.wearableDataRepository.find({
      where: { userId, provider },
      order: { startTime: 'DESC' },
    });

    if (data.length === 0) {
      return {
        provider,
        totalActivities: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        averageHeartRate: 0,
        mostUsedStyle: SwimStyle.UNKNOWN,
      };
    }

    const totalDistance = data.reduce((sum, d) => sum + (d.distance || 0), 0);
    const totalDuration = data.reduce((sum, d) => sum + d.duration, 0);
    const totalCalories = data.reduce((sum, d) => sum + (d.calories || 0), 0);
    const averageHeartRate =
      data.reduce((sum, d) => sum + (d.averageHeartRate || 0), 0) / data.length;

    // 가장 많이 사용한 영법
    const styleCounts = data.reduce(
      (acc, d) => {
        if (d.swimStyle && d.swimStyle !== SwimStyle.UNKNOWN) {
          acc[d.swimStyle] = (acc[d.swimStyle] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostUsedStyle =
      Object.keys(styleCounts).length > 0
        ? (Object.entries(styleCounts).sort(
            ([, a], [, b]) => b - a,
          )[0][0] as SwimStyle)
        : SwimStyle.UNKNOWN;

    return {
      provider,
      totalActivities: data.length,
      totalDistance,
      totalDuration,
      totalCalories,
      averageHeartRate,
      mostUsedStyle,
      lastActivityDate: data[0]?.startTime,
    };
  }

  // 테스트용 모의 데이터 생성
  private generateMockSwimmingData(
    userId: number,
    provider: WearableProvider,
  ): Partial<WearableData> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 1);
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    return {
      userId,
      provider,
      externalActivityId: `mock_${Date.now()}`,
      activityType: ActivityType.SWIMMING,
      swimStyle: SwimStyle.FREESTYLE,
      startTime,
      endTime,
      duration,
      distance: Math.random() * 1000 + 500, // 500-1500m
      calories: Math.random() * 200 + 100, // 100-300 calories
      averageHeartRate: Math.random() * 40 + 120, // 120-160 bpm
      maxHeartRate: Math.random() * 20 + 160, // 160-180 bpm
      averageSpeed: Math.random() * 0.5 + 1.0, // 1.0-1.5 m/s
      maxSpeed: Math.random() * 0.5 + 1.5, // 1.5-2.0 m/s
      strokeCount: Math.floor(Math.random() * 50 + 100), // 100-150 strokes
      strokeRate: Math.random() * 20 + 40, // 40-60 strokes/min
      segments: [],
      rawData: { mock: true },
      isProcessed: false,
    };
  }
}
