import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { Record } from './entities/record.entity';
import { DetailedRecord } from './entities/detailed-record.entity';
import { SwimSegment } from './entities/swim-segment.entity';
import { AchievementsModule } from '../achievements/achievements.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Record, DetailedRecord, SwimSegment]),
    AchievementsModule,
    GoalsModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
})
export class RecordsModule {}
