import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommend, RecommendDocument } from './schemas/recommend.schema';
import { RecommendRequestDto } from './dto/recommend.dto';

@Injectable()
export class RecommendService {
  constructor(
    @InjectModel(Recommend.name)
    private recommendModel: Model<RecommendDocument>,
  ) {}

  async recommend(
    data: RecommendRequestDto,
    userId: number,
  ): Promise<Recommend> {
    // 간단한 rule-based 추천 예시
    const { distance, style, duration, frequency_per_week, goal } = data;
    let swim_training = '';
    let dryland_training = '';

    if (goal === 'endurance') {
      swim_training = '200m x 5회 인터벌, 1분 휴식';
      dryland_training = '플랭크 3세트, 버피 3세트';
    } else if (goal === 'speed') {
      swim_training = '50m x 8회 스프린트, 2분 휴식';
      dryland_training = '점프 스쿼트, 푸쉬업';
    } else {
      swim_training = '자유 수영 30분';
      dryland_training = '스트레칭, 코어 운동';
    }

    const recommend = new this.recommendModel({
      userId,
      swim_training,
      dryland_training,
      input: data,
    });

    return recommend.save();
  }

  async findByUserId(userId: number): Promise<Recommend[]> {
    return this.recommendModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}
