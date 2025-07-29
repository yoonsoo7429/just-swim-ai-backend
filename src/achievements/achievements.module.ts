import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementConfigService } from './achievement-config.service';
import { Achievement } from './entities/achievement.entity';
import { AchievementConfig } from './entities/achievement-config.entity';
import { Record } from '../records/entities/record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, AchievementConfig, Record])],
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementConfigService],
  exports: [AchievementsService, AchievementConfigService],
})
export class AchievementsModule {}
