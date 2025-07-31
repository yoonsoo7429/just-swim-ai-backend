import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommend, RecommendDocument } from './schemas/recommend.schema';
import { RecommendRequestDto } from './dto/recommend.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from '../records/entities/record.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { Goal } from '../goals/entities/goal.entity';
import {
  WearableData,
  ActivityType,
  SwimStyle,
} from '../wearable/entities/wearable-data.entity';

export interface UserProfile {
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  preferredStyles: string[];
  trainingFrequency: number;
  recentPerformance: number;
  goals: string[];
  achievements: Achievement[];
  consistency: number;
  wearableData?: {
    hasWearableData: boolean;
    lastSyncDate?: Date;
    totalWearableActivities: number;
    averageHeartRate: number;
    strokeRate: number;
    preferredSwimStyle: SwimStyle;
  };
}

interface TrainingPlan {
  swim_training: string;
  dryland_training: string;
  intensity: 'low' | 'medium' | 'high';
  focus: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

@Injectable()
export class RecommendService {
  constructor(
    @InjectModel(Recommend.name)
    private recommendModel: Model<RecommendDocument>,
    @InjectRepository(Record)
    private recordsRepository: Repository<Record>,
    @InjectRepository(Achievement)
    private achievementsRepository: Repository<Achievement>,
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    @InjectRepository(WearableData)
    private wearableDataRepository: Repository<WearableData>,
  ) {}

  async recommend(
    data: RecommendRequestDto,
    userId: number,
  ): Promise<Recommend> {
    // 사용자 프로필 분석
    const userProfile = await this.analyzeUserProfile(userId);

    // 개인화된 훈련 계획 생성
    const trainingPlan = this.generatePersonalizedPlan(data, userProfile);

    // 추천 저장
    const recommend = new this.recommendModel({
      userId,
      swim_training: trainingPlan.swim_training,
      dryland_training: trainingPlan.dryland_training,
      intensity: trainingPlan.intensity,
      focus: trainingPlan.focus,
      duration: trainingPlan.duration,
      difficulty: trainingPlan.difficulty,
      input: data,
      userProfile: userProfile,
    });

    return recommend.save();
  }

  async findByUserId(userId: number): Promise<Recommend[]> {
    return this.recommendModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  // 사용자 프로필 분석 (웨어러블 데이터 포함)
  async analyzeUserProfile(userId: number): Promise<UserProfile> {
    const records = await this.recordsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const achievements = await this.achievementsRepository.find({
      where: { userId },
    });

    const goals = await this.goalsRepository.find({
      where: { userId },
    });

    // 웨어러블 데이터 조회
    const wearableData = await this.wearableDataRepository.find({
      where: { userId, activityType: ActivityType.SWIMMING },
      order: { startTime: 'DESC' },
    });

    if (records.length === 0 && wearableData.length === 0) {
      return this.getDefaultProfile();
    }

    // 기존 기록 데이터 분석
    const totalDistance = records.reduce(
      (sum, r) => sum + Number(r.distance),
      0,
    );
    const totalTime = records.reduce((sum, r) => sum + r.duration, 0);
    const averageSpeed = totalTime > 0 ? totalDistance / totalTime : 0;

    // 선호 영법 분석 (기록 + 웨어러블 데이터)
    const styleCounts = records.reduce(
      (acc, r) => {
        acc[r.style] = (acc[r.style] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    // 웨어러블 데이터의 영법 정보 추가
    wearableData.forEach((data) => {
      if (data.swimStyle && data.swimStyle !== SwimStyle.UNKNOWN) {
        styleCounts[data.swimStyle] = (styleCounts[data.swimStyle] || 0) + 1;
      }
    });

    const preferredStyles = Object.entries(styleCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([style]) => style);

    // 훈련 빈도 분석 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = records.filter(
      (r) => new Date(r.date) >= thirtyDaysAgo,
    );
    const recentWearableData = wearableData.filter(
      (d) => d.startTime >= thirtyDaysAgo,
    );
    const trainingFrequency = recentRecords.length + recentWearableData.length;

    // 최근 성과 분석 (기록 + 웨어러블 데이터)
    const recentPerformance = this.calculateRecentPerformance(
      records.slice(0, 5),
      wearableData.slice(0, 5),
    );

    // 일관성 점수
    const consistency = this.calculateConsistencyScore(records, wearableData);

    // 웨어러블 데이터 분석
    const wearableAnalysis = this.analyzeWearableData(wearableData);

    return {
      totalDistance: totalDistance + wearableAnalysis.totalDistance,
      totalTime: totalTime + wearableAnalysis.totalDuration,
      averageSpeed:
        (totalDistance + wearableAnalysis.totalDistance) /
          (totalTime + wearableAnalysis.totalDuration) || 0,
      preferredStyles,
      trainingFrequency,
      recentPerformance,
      goals: goals.map((g) => g.title),
      achievements,
      consistency,
      wearableData: wearableAnalysis,
    };
  }

  // 웨어러블 데이터 분석
  private analyzeWearableData(wearableData: WearableData[]): {
    hasWearableData: boolean;
    lastSyncDate?: Date;
    totalWearableActivities: number;
    averageHeartRate: number;
    strokeRate: number;
    preferredSwimStyle: SwimStyle;
    totalDistance: number;
    totalDuration: number;
  } {
    if (wearableData.length === 0) {
      return {
        hasWearableData: false,
        totalWearableActivities: 0,
        averageHeartRate: 0,
        strokeRate: 0,
        preferredSwimStyle: SwimStyle.UNKNOWN,
        totalDistance: 0,
        totalDuration: 0,
      };
    }

    const totalDistance = wearableData.reduce(
      (sum, d) => sum + (d.distance || 0),
      0,
    );
    const totalDuration = wearableData.reduce((sum, d) => sum + d.duration, 0);
    const averageHeartRate =
      wearableData.reduce((sum, d) => sum + (d.averageHeartRate || 0), 0) /
      wearableData.length;
    const averageStrokeRate =
      wearableData.reduce((sum, d) => sum + (d.strokeRate || 0), 0) /
      wearableData.length;

    // 가장 많이 사용한 영법
    const styleCounts = wearableData.reduce(
      (acc, d) => {
        if (d.swimStyle && d.swimStyle !== SwimStyle.UNKNOWN) {
          acc[d.swimStyle] = (acc[d.swimStyle] || 0) + 1;
        }
        return acc;
      },
      {} as { [key: string]: number },
    );

    const preferredSwimStyle =
      Object.keys(styleCounts).length > 0
        ? (Object.entries(styleCounts).sort(
            ([, a], [, b]) => (b as number) - (a as number),
          )[0][0] as SwimStyle)
        : SwimStyle.UNKNOWN;

    return {
      hasWearableData: true,
      lastSyncDate: wearableData[0]?.startTime,
      totalWearableActivities: wearableData.length,
      averageHeartRate,
      strokeRate: averageStrokeRate,
      preferredSwimStyle,
      totalDistance,
      totalDuration,
    };
  }

  // 추천 통계 조회
  async getRecommendationStats(userId: number) {
    const recommendations = await this.findByUserId(userId);
    const userProfile = await this.analyzeUserProfile(userId);

    const difficultyStats = {
      beginner: recommendations.filter((r) => r.difficulty === 'beginner')
        .length,
      intermediate: recommendations.filter(
        (r) => r.difficulty === 'intermediate',
      ).length,
      advanced: recommendations.filter((r) => r.difficulty === 'advanced')
        .length,
    };

    const intensityStats = {
      low: recommendations.filter((r) => r.intensity === 'low').length,
      medium: recommendations.filter((r) => r.intensity === 'medium').length,
      high: recommendations.filter((r) => r.intensity === 'high').length,
    };

    const focusStats = recommendations.reduce(
      (acc, r) => {
        acc[r.focus] = (acc[r.focus] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    return {
      totalRecommendations: recommendations.length,
      userProfile,
      difficultyStats,
      intensityStats,
      focusStats,
      averageDuration:
        recommendations.length > 0
          ? recommendations.reduce((sum, r) => sum + (r.duration || 60), 0) /
            recommendations.length
          : 60,
    };
  }

  // 개인화된 훈련 계획 생성 (웨어러블 데이터 활용)
  private generatePersonalizedPlan(
    data: RecommendRequestDto,
    profile: UserProfile,
  ): TrainingPlan {
    const { goal, style, duration, frequency_per_week } = data;

    // 웨어러블 데이터가 있으면 더 정확한 분석
    if (profile.wearableData?.hasWearableData) {
      return this.generateWearableBasedPlan(data, profile);
    }

    // 기존 방식
    const difficulty = this.determineDifficulty(profile);
    const focus = this.determineFocus(goal, profile);
    const intensity = this.determineIntensity(profile, frequency_per_week);

    const swim_training = this.generateSwimTraining(
      goal,
      style,
      difficulty,
      intensity,
      profile,
    );

    const dryland_training = this.generateDrylandTraining(
      goal,
      difficulty,
      intensity,
      profile,
    );

    return {
      swim_training,
      dryland_training,
      intensity,
      focus,
      duration: duration || 60,
      difficulty,
    };
  }

  // 개인화된 훈련 계획 생성 (웨어러블 데이터 활용)
  private generateWearableBasedPlan(
    data: RecommendRequestDto,
    profile: UserProfile,
  ): TrainingPlan {
    const { goal, style, duration, frequency_per_week } = data;
    const wearableData = profile.wearableData!;

    // 웨어러블 데이터를 활용한 더 정확한 난이도 결정
    const difficulty = this.determineWearableBasedDifficulty(
      profile,
      wearableData,
    );
    const focus = this.determineWearableBasedFocus(goal, profile, wearableData);
    const intensity = this.determineWearableBasedIntensity(
      profile,
      frequency_per_week,
      wearableData,
    );

    const swim_training = this.generateWearableBasedSwimTraining(
      goal,
      style,
      difficulty,
      intensity,
      profile,
      wearableData,
    );

    const dryland_training = this.generateWearableBasedDrylandTraining(
      goal,
      difficulty,
      intensity,
      profile,
      wearableData,
    );

    return {
      swim_training,
      dryland_training,
      intensity,
      focus,
      duration: duration || 60,
      difficulty,
    };
  }

  // 난이도 결정
  private determineDifficulty(
    profile: UserProfile,
  ): 'beginner' | 'intermediate' | 'advanced' {
    const { totalDistance, trainingFrequency, consistency } = profile;

    if (totalDistance < 5000 || trainingFrequency < 2 || consistency < 0.3) {
      return 'beginner';
    } else if (
      totalDistance < 20000 ||
      trainingFrequency < 4 ||
      consistency < 0.6
    ) {
      return 'intermediate';
    } else {
      return 'advanced';
    }
  }

  // 집중 영역 결정
  private determineFocus(goal: string, profile: UserProfile): string {
    const { recentPerformance, averageSpeed } = profile;

    switch (goal) {
      case 'endurance':
        return recentPerformance < 0.7 ? '기술 개선' : '지구력 향상';
      case 'speed':
        return averageSpeed < 1.5 ? '기본 체력' : '폭발력';
      case 'technique':
        return '영법 정교화';
      case 'weight_loss':
        return '칼로리 소모';
      default:
        return '전반적 향상';
    }
  }

  // 강도 결정
  private determineIntensity(
    profile: UserProfile,
    frequency: number,
  ): 'low' | 'medium' | 'high' {
    const { trainingFrequency, consistency } = profile;

    if (frequency <= 2 || consistency < 0.4) {
      return 'low';
    } else if (frequency <= 4 || consistency < 0.7) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  // 수영 훈련 계획 생성
  private generateSwimTraining(
    goal: string,
    style: string,
    difficulty: string,
    intensity: string,
    profile: UserProfile,
  ): string {
    const { preferredStyles, totalDistance } = profile;

    const baseStyle = style || preferredStyles[0] || 'freestyle';

    switch (goal) {
      case 'endurance':
        return this.generateEnduranceTraining(
          baseStyle,
          difficulty,
          intensity,
          totalDistance,
        );
      case 'speed':
        return this.generateSpeedTraining(baseStyle, difficulty, intensity);
      case 'technique':
        return this.generateTechniqueTraining(baseStyle, difficulty);
      case 'weight_loss':
        return this.generateWeightLossTraining(
          baseStyle,
          difficulty,
          intensity,
        );
      default:
        return this.generateGeneralTraining(baseStyle, difficulty, intensity);
    }
  }

  // 지구력 훈련
  private generateEnduranceTraining(
    style: string,
    difficulty: string,
    intensity: string,
    totalDistance: number,
  ): string {
    const baseDistance =
      totalDistance < 10000 ? 200 : totalDistance < 30000 ? 400 : 800;

    switch (difficulty) {
      case 'beginner':
        return `${baseDistance}m ${style} x 3회, 2분 휴식`;
      case 'intermediate':
        return `${baseDistance}m ${style} x 5회, 1분 30초 휴식`;
      case 'advanced':
        return `${baseDistance}m ${style} x 8회, 1분 휴식`;
      default:
        return `${baseDistance}m ${style} x 3회, 2분 휴식`;
    }
  }

  // 속도 훈련
  private generateSpeedTraining(
    style: string,
    difficulty: string,
    intensity: string,
  ): string {
    switch (difficulty) {
      case 'beginner':
        return `50m ${style} 스프린트 x 6회, 3분 휴식`;
      case 'intermediate':
        return `50m ${style} 스프린트 x 10회, 2분 휴식`;
      case 'advanced':
        return `50m ${style} 스프린트 x 15회, 1분 30초 휴식`;
      default:
        return `50m ${style} 스프린트 x 6회, 3분 휴식`;
    }
  }

  // 기술 훈련
  private generateTechniqueTraining(style: string, difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return `25m ${style} 기술 연습 x 8회, 각 세트 후 30초 휴식`;
      case 'intermediate':
        return `50m ${style} 기술 연습 x 6회, 각 세트 후 1분 휴식`;
      case 'advanced':
        return `100m ${style} 기술 연습 x 4회, 각 세트 후 2분 휴식`;
      default:
        return `25m ${style} 기술 연습 x 8회, 각 세트 후 30초 휴식`;
    }
  }

  // 체중 감량 훈련
  private generateWeightLossTraining(
    style: string,
    difficulty: string,
    intensity: string,
  ): string {
    switch (difficulty) {
      case 'beginner':
        return `자유 수영 30분, 중간 강도`;
      case 'intermediate':
        return `인터벌 훈련: 100m x 10회, 1분 휴식`;
      case 'advanced':
        return `고강도 인터벌: 50m 스프린트 x 20회, 30초 휴식`;
      default:
        return `자유 수영 30분, 중간 강도`;
    }
  }

  // 일반 훈련
  private generateGeneralTraining(
    style: string,
    difficulty: string,
    intensity: string,
  ): string {
    switch (difficulty) {
      case 'beginner':
        return `200m ${style} x 3회, 2분 휴식`;
      case 'intermediate':
        return `300m ${style} x 4회, 1분 30초 휴식`;
      case 'advanced':
        return `400m ${style} x 5회, 1분 휴식`;
      default:
        return `200m ${style} x 3회, 2분 휴식`;
    }
  }

  // 드라이랜드 훈련 계획 생성
  private generateDrylandTraining(
    goal: string,
    difficulty: string,
    intensity: string,
    profile: UserProfile,
  ): string {
    switch (goal) {
      case 'endurance':
        return this.generateEnduranceDryland(difficulty, intensity);
      case 'speed':
        return this.generateSpeedDryland(difficulty, intensity);
      case 'technique':
        return this.generateTechniqueDryland(difficulty);
      case 'weight_loss':
        return this.generateWeightLossDryland(difficulty, intensity);
      default:
        return this.generateGeneralDryland(difficulty, intensity);
    }
  }

  // 지구력 드라이랜드
  private generateEnduranceDryland(
    difficulty: string,
    intensity: string,
  ): string {
    switch (difficulty) {
      case 'beginner':
        return '플랭크 30초 x 3세트, 스쿼트 10회 x 3세트';
      case 'intermediate':
        return '플랭크 1분 x 3세트, 스쿼트 15회 x 4세트, 버피 10회 x 3세트';
      case 'advanced':
        return '플랭크 2분 x 4세트, 스쿼트 20회 x 5세트, 버피 15회 x 4세트';
      default:
        return '플랭크 30초 x 3세트, 스쿼트 10회 x 3세트';
    }
  }

  // 속도 드라이랜드
  private generateSpeedDryland(difficulty: string, intensity: string): string {
    switch (difficulty) {
      case 'beginner':
        return '점프 스쿼트 10회 x 3세트, 푸쉬업 5회 x 3세트';
      case 'intermediate':
        return '점프 스쿼트 15회 x 4세트, 푸쉬업 10회 x 4세트, 클라이밍 5분';
      case 'advanced':
        return '점프 스쿼트 20회 x 5세트, 푸쉬업 15회 x 5세트, 클라이밍 10분';
      default:
        return '점프 스쿼트 10회 x 3세트, 푸쉬업 5회 x 3세트';
    }
  }

  // 기술 드라이랜드
  private generateTechniqueDryland(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return '스트레칭 15분, 코어 운동 10분';
      case 'intermediate':
        return '스트레칭 20분, 코어 운동 15분, 밴드 운동 10분';
      case 'advanced':
        return '스트레칭 25분, 코어 운동 20분, 밴드 운동 15분';
      default:
        return '스트레칭 15분, 코어 운동 10분';
    }
  }

  // 체중 감량 드라이랜드
  private generateWeightLossDryland(
    difficulty: string,
    intensity: string,
  ): string {
    switch (difficulty) {
      case 'beginner':
        return '카디오 20분, 스쿼트 10회 x 3세트';
      case 'intermediate':
        return '카디오 30분, 스쿼트 15회 x 4세트, 버피 10회 x 3세트';
      case 'advanced':
        return '카디오 45분, 스쿼트 20회 x 5세트, 버피 15회 x 4세트';
      default:
        return '카디오 20분, 스쿼트 10회 x 3세트';
    }
  }

  // 일반 드라이랜드
  private generateGeneralDryland(
    difficulty: string,
    intensity: string,
  ): string {
    switch (difficulty) {
      case 'beginner':
        return '스트레칭 10분, 플랭크 30초 x 2세트';
      case 'intermediate':
        return '스트레칭 15분, 플랭크 1분 x 3세트, 스쿼트 10회 x 3세트';
      case 'advanced':
        return '스트레칭 20분, 플랭크 2분 x 4세트, 스쿼트 15회 x 4세트';
      default:
        return '스트레칭 10분, 플랭크 30초 x 2세트';
    }
  }

  // 웨어러블 데이터 기반 난이도 결정
  private determineWearableBasedDifficulty(
    profile: UserProfile,
    wearableData: UserProfile['wearableData'],
  ): 'beginner' | 'intermediate' | 'advanced' {
    const { totalDistance, trainingFrequency, consistency } = profile;
    const { averageHeartRate, strokeRate } = wearableData!;

    // 심박수와 스트로크 레이트를 고려한 난이도 결정
    if (averageHeartRate > 150 && strokeRate > 50) {
      return 'advanced';
    } else if (averageHeartRate > 130 && strokeRate > 40) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  // 웨어러블 데이터 기반 집중 영역 결정
  private determineWearableBasedFocus(
    goal: string,
    profile: UserProfile,
    wearableData: UserProfile['wearableData'],
  ): string {
    const { recentPerformance, averageSpeed } = profile;
    const { averageHeartRate, strokeRate, preferredSwimStyle } = wearableData!;

    switch (goal) {
      case 'endurance':
        if (averageHeartRate > 140) {
          return '심박수 관리 및 지구력 향상';
        }
        return recentPerformance < 0.7 ? '기술 개선' : '지구력 향상';
      case 'speed':
        if (strokeRate > 60) {
          return '스트로크 효율성 개선';
        }
        return averageSpeed < 1.5 ? '기본 체력' : '폭발력';
      case 'technique':
        return `${preferredSwimStyle} 영법 정교화`;
      case 'weight_loss':
        return '칼로리 소모 및 심박수 관리';
      default:
        return '전반적 향상';
    }
  }

  // 웨어러블 데이터 기반 강도 결정
  private determineWearableBasedIntensity(
    profile: UserProfile,
    frequency: number,
    wearableData: UserProfile['wearableData'],
  ): 'low' | 'medium' | 'high' {
    const { trainingFrequency, consistency } = profile;
    const { averageHeartRate } = wearableData!;

    // 심박수 기반 강도 결정
    if (averageHeartRate > 150) {
      return 'high';
    } else if (averageHeartRate > 130) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // 웨어러블 데이터 기반 수영 훈련 계획
  private generateWearableBasedSwimTraining(
    goal: string,
    style: string,
    difficulty: string,
    intensity: string,
    profile: UserProfile,
    wearableData: UserProfile['wearableData'],
  ): string {
    const { preferredStyles, totalDistance } = profile;
    const { averageHeartRate, strokeRate, preferredSwimStyle } = wearableData!;

    const baseStyle =
      style || preferredSwimStyle || preferredStyles[0] || 'freestyle';

    switch (goal) {
      case 'endurance':
        return this.generateWearableBasedEnduranceTraining(
          baseStyle,
          difficulty,
          intensity,
          totalDistance,
          averageHeartRate,
        );
      case 'speed':
        return this.generateWearableBasedSpeedTraining(
          baseStyle,
          difficulty,
          intensity,
          strokeRate,
        );
      case 'technique':
        return this.generateWearableBasedTechniqueTraining(
          baseStyle,
          difficulty,
          strokeRate,
        );
      case 'weight_loss':
        return this.generateWearableBasedWeightLossTraining(
          baseStyle,
          difficulty,
          intensity,
          averageHeartRate,
        );
      default:
        return this.generateWearableBasedGeneralTraining(
          baseStyle,
          difficulty,
          intensity,
          averageHeartRate,
        );
    }
  }

  // 웨어러블 데이터 기반 지구력 훈련
  private generateWearableBasedEnduranceTraining(
    style: string,
    difficulty: string,
    intensity: string,
    totalDistance: number,
    averageHeartRate: number,
  ): string {
    const baseDistance =
      totalDistance < 10000 ? 200 : totalDistance < 30000 ? 400 : 800;
    const targetHeartRate = Math.min(averageHeartRate + 10, 160);

    switch (difficulty) {
      case 'beginner':
        return `${baseDistance}m ${style} x 3회, 목표 심박수 ${targetHeartRate}bpm, 2분 휴식`;
      case 'intermediate':
        return `${baseDistance}m ${style} x 5회, 목표 심박수 ${targetHeartRate}bpm, 1분 30초 휴식`;
      case 'advanced':
        return `${baseDistance}m ${style} x 8회, 목표 심박수 ${targetHeartRate}bpm, 1분 휴식`;
      default:
        return `${baseDistance}m ${style} x 3회, 목표 심박수 ${targetHeartRate}bpm, 2분 휴식`;
    }
  }

  // 웨어러블 데이터 기반 속도 훈련
  private generateWearableBasedSpeedTraining(
    style: string,
    difficulty: string,
    intensity: string,
    strokeRate: number,
  ): string {
    const targetStrokeRate = Math.min(strokeRate + 10, 80);

    switch (difficulty) {
      case 'beginner':
        return `50m ${style} 스프린트 x 6회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 3분 휴식`;
      case 'intermediate':
        return `50m ${style} 스프린트 x 10회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 2분 휴식`;
      case 'advanced':
        return `50m ${style} 스프린트 x 15회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 1분 30초 휴식`;
      default:
        return `50m ${style} 스프린트 x 6회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 3분 휴식`;
    }
  }

  // 웨어러블 데이터 기반 기술 훈련
  private generateWearableBasedTechniqueTraining(
    style: string,
    difficulty: string,
    strokeRate: number,
  ): string {
    const targetStrokeRate = Math.max(strokeRate - 5, 30);

    switch (difficulty) {
      case 'beginner':
        return `25m ${style} 기술 연습 x 8회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 각 세트 후 30초 휴식`;
      case 'intermediate':
        return `50m ${style} 기술 연습 x 6회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 각 세트 후 1분 휴식`;
      case 'advanced':
        return `100m ${style} 기술 연습 x 4회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 각 세트 후 2분 휴식`;
      default:
        return `25m ${style} 기술 연습 x 8회, 목표 스트로크 레이트 ${targetStrokeRate}/min, 각 세트 후 30초 휴식`;
    }
  }

  // 웨어러블 데이터 기반 체중 감량 훈련
  private generateWearableBasedWeightLossTraining(
    style: string,
    difficulty: string,
    intensity: string,
    averageHeartRate: number,
  ): string {
    const targetHeartRate = Math.min(averageHeartRate + 15, 170);

    switch (difficulty) {
      case 'beginner':
        return `자유 수영 30분, 목표 심박수 ${targetHeartRate}bpm, 중간 강도`;
      case 'intermediate':
        return `인터벌 훈련: 100m x 10회, 목표 심박수 ${targetHeartRate}bpm, 1분 휴식`;
      case 'advanced':
        return `고강도 인터벌: 50m 스프린트 x 20회, 목표 심박수 ${targetHeartRate}bpm, 30초 휴식`;
      default:
        return `자유 수영 30분, 목표 심박수 ${targetHeartRate}bpm, 중간 강도`;
    }
  }

  // 웨어러블 데이터 기반 일반 훈련
  private generateWearableBasedGeneralTraining(
    style: string,
    difficulty: string,
    intensity: string,
    averageHeartRate: number,
  ): string {
    const targetHeartRate = Math.min(averageHeartRate + 5, 150);

    switch (difficulty) {
      case 'beginner':
        return `200m ${style} x 3회, 목표 심박수 ${targetHeartRate}bpm, 2분 휴식`;
      case 'intermediate':
        return `300m ${style} x 4회, 목표 심박수 ${targetHeartRate}bpm, 1분 30초 휴식`;
      case 'advanced':
        return `400m ${style} x 5회, 목표 심박수 ${targetHeartRate}bpm, 1분 휴식`;
      default:
        return `200m ${style} x 3회, 목표 심박수 ${targetHeartRate}bpm, 2분 휴식`;
    }
  }

  // 웨어러블 데이터 기반 드라이랜드 훈련
  private generateWearableBasedDrylandTraining(
    goal: string,
    difficulty: string,
    intensity: string,
    profile: UserProfile,
    wearableData: UserProfile['wearableData'],
  ): string {
    const { averageHeartRate } = wearableData!;

    switch (goal) {
      case 'endurance':
        return this.generateWearableBasedEnduranceDryland(
          difficulty,
          intensity,
          averageHeartRate,
        );
      case 'speed':
        return this.generateWearableBasedSpeedDryland(
          difficulty,
          intensity,
          averageHeartRate,
        );
      case 'technique':
        return this.generateWearableBasedTechniqueDryland(
          difficulty,
          averageHeartRate,
        );
      case 'weight_loss':
        return this.generateWearableBasedWeightLossDryland(
          difficulty,
          intensity,
          averageHeartRate,
        );
      default:
        return this.generateWearableBasedGeneralDryland(
          difficulty,
          intensity,
          averageHeartRate,
        );
    }
  }

  // 웨어러블 데이터 기반 지구력 드라이랜드
  private generateWearableBasedEnduranceDryland(
    difficulty: string,
    intensity: string,
    averageHeartRate: number,
  ): string {
    const targetHeartRate = Math.min(averageHeartRate + 10, 160);

    switch (difficulty) {
      case 'beginner':
        return `플랭크 30초 x 3세트, 스쿼트 10회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
      case 'intermediate':
        return `플랭크 1분 x 3세트, 스쿼트 15회 x 4세트, 버피 10회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
      case 'advanced':
        return `플랭크 2분 x 4세트, 스쿼트 20회 x 5세트, 버피 15회 x 4세트, 목표 심박수 ${targetHeartRate}bpm`;
      default:
        return `플랭크 30초 x 3세트, 스쿼트 10회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
    }
  }

  // 웨어러블 데이터 기반 속도 드라이랜드
  private generateWearableBasedSpeedDryland(
    difficulty: string,
    intensity: string,
    averageHeartRate: number,
  ): string {
    const targetHeartRate = Math.min(averageHeartRate + 15, 170);

    switch (difficulty) {
      case 'beginner':
        return `점프 스쿼트 10회 x 3세트, 푸쉬업 5회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
      case 'intermediate':
        return `점프 스쿼트 15회 x 4세트, 푸쉬업 10회 x 4세트, 클라이밍 5분, 목표 심박수 ${targetHeartRate}bpm`;
      case 'advanced':
        return `점프 스쿼트 20회 x 5세트, 푸쉬업 15회 x 5세트, 클라이밍 10분, 목표 심박수 ${targetHeartRate}bpm`;
      default:
        return `점프 스쿼트 10회 x 3세트, 푸쉬업 5회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
    }
  }

  // 웨어러블 데이터 기반 기술 드라이랜드
  private generateWearableBasedTechniqueDryland(
    difficulty: string,
    averageHeartRate: number,
  ): string {
    const targetHeartRate = Math.max(averageHeartRate - 10, 100);

    switch (difficulty) {
      case 'beginner':
        return `스트레칭 15분, 코어 운동 10분, 목표 심박수 ${targetHeartRate}bpm`;
      case 'intermediate':
        return `스트레칭 20분, 코어 운동 15분, 밴드 운동 10분, 목표 심박수 ${targetHeartRate}bpm`;
      case 'advanced':
        return `스트레칭 25분, 코어 운동 20분, 밴드 운동 15분, 목표 심박수 ${targetHeartRate}bpm`;
      default:
        return `스트레칭 15분, 코어 운동 10분, 목표 심박수 ${targetHeartRate}bpm`;
    }
  }

  // 웨어러블 데이터 기반 체중 감량 드라이랜드
  private generateWearableBasedWeightLossDryland(
    difficulty: string,
    intensity: string,
    averageHeartRate: number,
  ): string {
    const targetHeartRate = Math.min(averageHeartRate + 20, 180);

    switch (difficulty) {
      case 'beginner':
        return `카디오 20분, 스쿼트 10회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
      case 'intermediate':
        return `카디오 30분, 스쿼트 15회 x 4세트, 버피 10회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
      case 'advanced':
        return `카디오 45분, 스쿼트 20회 x 5세트, 버피 15회 x 4세트, 목표 심박수 ${targetHeartRate}bpm`;
      default:
        return `카디오 20분, 스쿼트 10회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
    }
  }

  // 웨어러블 데이터 기반 일반 드라이랜드
  private generateWearableBasedGeneralDryland(
    difficulty: string,
    intensity: string,
    averageHeartRate: number,
  ): string {
    const targetHeartRate = Math.min(averageHeartRate + 5, 150);

    switch (difficulty) {
      case 'beginner':
        return `스트레칭 10분, 플랭크 30초 x 2세트, 목표 심박수 ${targetHeartRate}bpm`;
      case 'intermediate':
        return `스트레칭 15분, 플랭크 1분 x 3세트, 스쿼트 10회 x 3세트, 목표 심박수 ${targetHeartRate}bpm`;
      case 'advanced':
        return `스트레칭 20분, 플랭크 2분 x 4세트, 스쿼트 15회 x 4세트, 목표 심박수 ${targetHeartRate}bpm`;
      default:
        return `스트레칭 10분, 플랭크 30초 x 2세트, 목표 심박수 ${targetHeartRate}bpm`;
    }
  }

  // 최근 성과 계산 (웨어러블 데이터 포함)
  private calculateRecentPerformance(
    records: Record[],
    wearableData: WearableData[],
  ): number {
    const allActivities = [
      ...records.map((r) => ({
        speed: Number(r.distance) / r.duration,
        type: 'record',
      })),
      ...wearableData.map((d) => ({
        speed: (d.distance || 0) / d.duration,
        type: 'wearable',
      })),
    ];

    if (allActivities.length < 2) return 0.5;

    const speeds = allActivities.map((a) => a.speed);
    const avgSpeed =
      speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

    // 속도 기준 정규화 (0-1 범위)
    return Math.min(avgSpeed / 2, 1);
  }

  // 일관성 점수 계산 (웨어러블 데이터 포함)
  private calculateConsistencyScore(
    records: Record[],
    wearableData: WearableData[],
  ): number {
    const allActivities = [
      ...records.map((r) => ({ date: new Date(r.date), type: 'record' })),
      ...wearableData.map((d) => ({ date: d.startTime, type: 'wearable' })),
    ];

    if (allActivities.length === 0) return 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivities = allActivities.filter(
      (a) => a.date >= thirtyDaysAgo,
    );
    const weeklyCounts = new Map<number, number>();

    recentActivities.forEach((activity) => {
      const weekNumber = Math.floor(
        activity.date.getTime() / (7 * 24 * 60 * 60 * 1000),
      );
      weeklyCounts.set(weekNumber, (weeklyCounts.get(weekNumber) || 0) + 1);
    });

    const consistentWeeks = Array.from(weeklyCounts.values()).filter(
      (count) => count >= 3,
    ).length;
    return consistentWeeks / 4; // 4주 기준
  }

  // 기본 프로필
  private getDefaultProfile(): UserProfile {
    return {
      totalDistance: 0,
      totalTime: 0,
      averageSpeed: 0,
      preferredStyles: ['freestyle'],
      trainingFrequency: 0,
      recentPerformance: 0.5,
      goals: [],
      achievements: [],
      consistency: 0,
    };
  }
}
