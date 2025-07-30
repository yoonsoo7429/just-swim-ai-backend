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

  @Column({ name: 'frequency_per_week', type: 'int' })
  frequencyPerWeek: number;

  @Column()
  goal: string;

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

  @Column({ name: 'total_laps', type: 'int', nullable: true })
  totalLaps?: number;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User, (user) => user.records)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => SwimSegment, (segment) => segment.record, {
    cascade: true,
    eager: true,
  })
  segments: SwimSegment[];
}
