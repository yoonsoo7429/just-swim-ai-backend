import { BaseTable } from 'src/common/entity/base-table.entity';
import { Provider } from 'src/common/enum/provider.enum';
import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class User extends BaseTable {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  userId: number;

  @Column({ type: 'enum', enum: Provider, nullable: true })
  provider: Provider;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;
}
