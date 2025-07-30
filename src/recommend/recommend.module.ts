import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendController } from './recommend.controller';
import { RecommendService } from './recommend.service';
import { Recommend, RecommendSchema } from './schemas/recommend.schema';
import { Record } from '../records/entities/record.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { Goal } from '../goals/entities/goal.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommend.name, schema: RecommendSchema },
    ]),
    TypeOrmModule.forFeature([Record, Achievement, Goal]),
  ],
  controllers: [RecommendController],
  providers: [RecommendService],
})
export class RecommendModule {}
