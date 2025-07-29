import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AchievementConfig,
  AchievementType,
} from './entities/achievement-config.entity';
import { achievementConfigSeeds } from './seeds/achievement-configs.seed';

@Injectable()
export class AchievementConfigService {
  constructor(
    @InjectRepository(AchievementConfig)
    private achievementConfigRepository: Repository<AchievementConfig>,
  ) {}

  async initializeConfigs(): Promise<void> {
    try {
      // 기존 설정이 있는지 확인
      const existingConfigs = await this.achievementConfigRepository.count();

      if (existingConfigs === 0) {
        // 시드 데이터 삽입
        await this.achievementConfigRepository.save(achievementConfigSeeds);
        console.log('성취 설정이 초기화되었습니다.');
      } else {
        console.log('성취 설정이 이미 존재합니다.');
      }
    } catch (error) {
      console.error('성취 설정 초기화 중 오류:', error);
    }
  }

  async getAllConfigs(): Promise<AchievementConfig[]> {
    return this.achievementConfigRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getConfigsByType(type: AchievementType): Promise<AchievementConfig[]> {
    return this.achievementConfigRepository.find({
      where: { type, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getConfigById(id: number): Promise<AchievementConfig | null> {
    return this.achievementConfigRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async createConfig(
    config: Partial<AchievementConfig>,
  ): Promise<AchievementConfig> {
    const newConfig = this.achievementConfigRepository.create(config);
    return this.achievementConfigRepository.save(newConfig);
  }

  async updateConfig(
    id: number,
    config: Partial<AchievementConfig>,
  ): Promise<AchievementConfig | null> {
    await this.achievementConfigRepository.update(id, config);
    return this.getConfigById(id);
  }

  async deleteConfig(id: number): Promise<void> {
    await this.achievementConfigRepository.update(id, { isActive: false });
  }
}
