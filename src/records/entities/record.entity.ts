import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { SwimSegment } from './swim-segment.entity';

@Entity('records')
export class Record extends BaseEntity {
  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distance: number;

  @Column()
  style: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ name: 'frequency_per_week', type: 'int', nullable: true })
  frequencyPerWeek?: number; // 웨어러블 데이터의 경우 nullable

  @Column({ nullable: true })
  goal?: string; // 웨어러블 데이터의 경우 nullable

  // 상세 정보 필드들 (기존 detailed_records에서 가져옴)
  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime?: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string;

  @Column({ name: 'pool_length', type: 'int', nullable: true })
  poolLength?: number; // 수영장 길이 (m)

  @Column({
    name: 'average_pace',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  averagePace?: number; // 100m당 분 단위

  @Column({ name: 'average_heart_rate', type: 'int', nullable: true })
  averageHeartRate?: number; // BPM

  @Column({ name: 'max_heart_rate', type: 'int', nullable: true })
  maxHeartRate?: number; // BPM (웨어러블 데이터용)

  @Column({ name: 'total_laps', type: 'int', nullable: true })
  totalLaps?: number;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // 웨어러블 데이터 전용 필드들
  @Column({
    name: 'calories',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  calories?: number;

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

  @Column({ name: 'data_source', type: 'varchar', length: 20, nullable: true })
  dataSource?: string; // 'manual' 또는 'wearable'

  @Column({
    name: 'wearable_provider',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  wearableProvider?: string; // Apple Health, Garmin 등

  @ManyToOne(() => User, (user) => user.records)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => SwimSegment, (segment) => segment.record, {
    cascade: true,
    eager: true,
  })
  segments: SwimSegment[];
}
