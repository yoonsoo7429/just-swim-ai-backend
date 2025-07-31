import {
  WearableProvider,
  ConnectionStatus,
} from '../entities/wearable-connection.entity';
import { ActivityType, SwimStyle } from '../entities/wearable-data.entity';

export class ConnectWearableDto {
  provider: WearableProvider;
  authorizationCode?: string;
  accessToken?: string;
  refreshToken?: string;
  externalUserId?: string;
}

export class SyncWearableDto {
  provider: WearableProvider;
  startDate?: string;
  endDate?: string;
}

export class WearableConnectionDto {
  id: number;
  userId: number;
  provider: WearableProvider;
  externalUserId: string;
  status: ConnectionStatus;
  lastSyncAt?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class WearableDataDto {
  id: number;
  userId: number;
  provider: WearableProvider;
  externalActivityId: string;
  activityType: ActivityType;
  swimStyle?: SwimStyle;
  startTime: Date;
  endTime: Date;
  duration: number;
  distance?: number;
  calories?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averageSpeed?: number;
  maxSpeed?: number;
  strokeCount?: number;
  strokeRate?: number;
  segments?: any[];
  isProcessed: boolean;
  processedAt?: Date;
  createdAt: Date;
}

export class WearableSyncResultDto {
  provider: WearableProvider;
  totalActivities: number;
  newActivities: number;
  updatedActivities: number;
  errors: string[];
  syncTime: Date;
}

export class WearableStatsDto {
  provider: WearableProvider;
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  totalCalories: number;
  averageHeartRate: number;
  mostUsedStyle: SwimStyle;
  lastActivityDate?: Date;
}
