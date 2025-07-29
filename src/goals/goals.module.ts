import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';
import { Record } from '../records/entities/record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Goal, Record])],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
