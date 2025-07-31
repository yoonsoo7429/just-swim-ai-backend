import { Module } from '@nestjs/common';
import { WearableController } from './wearable.controller';
import { WearableService } from './wearable.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WearableConnection } from './entities/wearable-connection.entity';
import { WearableData } from './entities/wearable-data.entity';
import { RecordsModule } from '../records/records.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WearableConnection, WearableData]),
    RecordsModule,
  ],
  controllers: [WearableController],
  providers: [WearableService],
  exports: [WearableService],
})
export class WearableModule {}
