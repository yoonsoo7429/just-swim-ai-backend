import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { SwimSegment } from './swim-segment.entity';

@Entity('detailed_records')
export class DetailedRecord extends BaseEntity {
  @Column()
  userId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'total_distance', type: 'decimal', precision: 10, scale: 2 })
  totalDistance: number;

  @Column({ name: 'total_duration', type: 'int' })
  totalDuration: number; // 분 단위

  @Column({ name: 'pool_length', type: 'int' })
  poolLength: number; // 수영장 길이 (m)

  @Column({ name: 'average_pace', type: 'decimal', precision: 6, scale: 2 })
  averagePace: number; // 100m당 분 단위

  @Column({ name: 'average_heart_rate', type: 'int', nullable: true })
  averageHeartRate?: number; // BPM

  @Column({ name: 'total_laps', type: 'int' })
  totalLaps: number;

  @Column({ name: 'frequency_per_week', type: 'int' })
  frequencyPerWeek: number;

  @Column()
  goal: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User, (user) => user.detailedRecords)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => SwimSegment, (segment) => segment.detailedRecord, {
    cascade: true,
    eager: true,
  })
  segments: SwimSegment[];
}
