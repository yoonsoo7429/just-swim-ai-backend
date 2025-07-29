import {
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateRecordDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  @Max(100000) // 100km 제한
  distance: number;

  @IsString()
  @IsIn(['freestyle', 'backstroke', 'breaststroke', 'butterfly'])
  style: string;

  @IsNumber()
  @Min(0)
  @Max(1440) // 24시간 제한 (분 단위)
  duration: number;

  @IsNumber()
  @Min(1)
  @Max(7)
  frequency_per_week: number;

  @IsString()
  @IsIn(['endurance', 'speed', 'technique'])
  goal: string;
}
