import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecommendDocument = Recommend & Document;

@Schema({ timestamps: true })
export class Recommend {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  swim_training: string;

  @Prop({ required: true })
  dryland_training: string;

  @Prop({ required: true, type: Object })
  input: {
    distance: number;
    style: string;
    duration: number;
    frequency_per_week: number;
    goal: string;
  };

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  intensity: string;

  @Prop({ default: '전반적 향상' })
  focus: string;

  @Prop({ default: 60 })
  duration: number;

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' })
  difficulty: string;

  @Prop({ type: Object })
  userProfile: {
    totalDistance: number;
    totalTime: number;
    averageSpeed: number;
    preferredStyles: string[];
    trainingFrequency: number;
    recentPerformance: number;
    goals: string[];
    consistency: number;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const RecommendSchema = SchemaFactory.createForClass(Recommend);
