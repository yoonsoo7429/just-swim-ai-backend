import {
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSwimSegmentDto {
  @IsString()
  @IsIn([
    'freestyle',
    'backstroke',
    'breaststroke',
    'butterfly',
    'kickboard',
    'pull',
  ])
  style: string;

  @IsNumber()
  @Min(0)
  @Max(100000) // 100km 제한
  distance: number;

  @IsNumber()
  @Min(0)
  @Max(1440) // 24시간 제한 (분 단위)
  duration: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60) // 60분/100m 제한
  pace?: number;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(200)
  heartRate?: number;

  @IsNumber()
  @Min(0)
  @Max(10000) // 10,000랩 제한
  laps: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // 웨어러블 데이터 전용 필드들
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(200)
  maxHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10) // 10m/s 제한
  averageSpeed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10) // 10m/s 제한
  maxSpeed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  strokeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200) // 200 strokes/min 제한
  strokeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000) // 10,000 calories 제한
  calories?: number;
}

export class CreateRecordDto {
  @IsDateString()
  date: string;

  // 기본 기록 필드들 (세그먼트가 없을 때 사용)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000) // 100km 제한
  distance?: number;

  @IsOptional()
  @IsString()
  @IsIn(['freestyle', 'backstroke', 'breaststroke', 'butterfly'])
  style?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1440) // 24시간 제한 (분 단위)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  frequency_per_week?: number; // 웨어러블 데이터의 경우 optional

  @IsOptional()
  @IsString()
  @IsIn(['endurance', 'speed', 'technique'])
  goal?: string; // 웨어러블 데이터의 경우 optional

  // 상세 정보 필드들 (선택사항)
  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(50)
  poolLength?: number;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(200)
  averageHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(200)
  maxHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalLaps?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // 웨어러블 데이터 전용 필드들
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000) // 10,000 calories 제한
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10) // 10m/s 제한
  averageSpeed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10) // 10m/s 제한
  maxSpeed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  strokeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200) // 200 strokes/min 제한
  strokeRate?: number;

  @IsOptional()
  @IsString()
  @IsIn(['manual', 'wearable'])
  dataSource?: string;

  @IsOptional()
  @IsString()
  wearableProvider?: string;

  // 세그먼트 정보 (상세 기록용)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSwimSegmentDto)
  segments?: CreateSwimSegmentDto[];
}
