import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';

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

  @ManyToOne(() => User, (user) => user.records)
  @JoinColumn({ name: 'userId' })
  user: User;
}
