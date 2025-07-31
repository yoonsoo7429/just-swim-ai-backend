import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Record } from './record.entity';

@Entity('swim_segments')
export class SwimSegment extends BaseEntity {
  @Column({ name: 'record_id' })
  recordId: number;

  @Column()
  style: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distance: number;

  @Column({ type: 'int' })
  duration: number; // 분 단위

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  pace?: number; // 100m당 분 단위

  @Column({ name: 'heart_rate', type: 'int', nullable: true })
  heartRate?: number; // BPM

  @Column({ type: 'int' })
  laps: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // 웨어러블 데이터 전용 필드들
  @Column({ name: 'max_heart_rate', type: 'int', nullable: true })
  maxHeartRate?: number; // BPM

  @Column({
    name: 'average_speed',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  averageSpeed?: number; // m/s

  @Column({
    name: 'max_speed',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  maxSpeed?: number; // m/s

  @Column({ name: 'stroke_count', type: 'int', nullable: true })
  strokeCount?: number;

  @Column({
    name: 'stroke_rate',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  strokeRate?: number; // strokes per minute

  @Column({
    name: 'calories',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  calories?: number;

  @ManyToOne(() => Record, (record) => record.segments)
  @JoinColumn({ name: 'record_id' })
  record: Record;
}
