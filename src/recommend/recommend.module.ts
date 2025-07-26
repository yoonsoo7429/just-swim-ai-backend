import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendController } from './recommend.controller';
import { RecommendService } from './recommend.service';
import { Recommend, RecommendSchema } from './schemas/recommend.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommend.name, schema: RecommendSchema },
    ]),
  ],
  controllers: [RecommendController],
  providers: [RecommendService],
})
export class RecommendModule {}
