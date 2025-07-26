import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecordDto } from './dto/create-record.dto';
import { Record } from './entities/record.entity';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Record)
    private recordsRepository: Repository<Record>,
  ) {}

  async create(
    createRecordDto: CreateRecordDto,
    userId: number,
  ): Promise<Record> {
    const record = this.recordsRepository.create({
      ...createRecordDto,
      userId,
      frequencyPerWeek: createRecordDto.frequency_per_week,
    });

    return this.recordsRepository.save(record);
  }

  async findByUserId(userId: number): Promise<Record[]> {
    return this.recordsRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Record | null> {
    return this.recordsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }
}
