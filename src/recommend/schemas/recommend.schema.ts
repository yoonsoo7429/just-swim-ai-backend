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

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const RecommendSchema = SchemaFactory.createForClass(Recommend);
