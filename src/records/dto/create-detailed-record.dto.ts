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
}

export class CreateDetailedRecordDto {
  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsNumber()
  @Min(20)
  @Max(50)
  poolLength: number;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(200)
  averageHeartRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSwimSegmentDto)
  segments: CreateSwimSegmentDto[];

  @IsNumber()
  @Min(1)
  @Max(7)
  frequencyPerWeek: number;

  @IsString()
  @IsIn(['endurance', 'speed', 'technique'])
  goal: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
