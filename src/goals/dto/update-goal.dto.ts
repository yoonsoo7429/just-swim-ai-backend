import { CreateGoalDto } from './create-goal.dto';
import { GoalStatus } from '../entities/goal.entity';

export class UpdateGoalDto extends CreateGoalDto {
  status?: GoalStatus;
  currentValue?: number;
  progress?: number;
  isCompleted?: boolean;
}
