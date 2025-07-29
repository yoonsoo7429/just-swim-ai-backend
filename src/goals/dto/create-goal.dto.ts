import {
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { GoalType } from '../entities/goal.entity';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(Object.values(GoalType))
  type: GoalType;

  @IsNumber({}, { message: 'targetValue must be a number' })
  @Min(0, { message: 'targetValue must not be less than 0' })
  targetValue: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurringType?: string; // daily, weekly, monthly
}
