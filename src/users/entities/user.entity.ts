import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Record } from 'src/records/entities/record.entity';
import { Achievement } from '../../achievements/entities/achievement.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nickname?: string;

  @OneToMany(() => Record, (record) => record.user, {
    eager: true,
    cascade: true,
  })
  records: Record[];

  @OneToMany(() => Achievement, (achievement) => achievement.user, {
    eager: true,
    cascade: true,
  })
  achievements: Achievement[];
}
