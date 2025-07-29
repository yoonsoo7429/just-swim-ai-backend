import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { DetailedRecord } from './detailed-record.entity';

@Entity('swim_segments')
export class SwimSegment extends BaseEntity {
  @Column({ name: 'detailed_record_id' })
  detailedRecordId: number;

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

  @ManyToOne(() => DetailedRecord, (detailedRecord) => detailedRecord.segments)
  @JoinColumn({ name: 'detailed_record_id' })
  detailedRecord: DetailedRecord;
}
