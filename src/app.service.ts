import { Injectable, OnModuleInit } from '@nestjs/common';
import { AchievementConfigService } from './achievements/achievement-config.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly achievementConfigService: AchievementConfigService,
  ) {}

  async onModuleInit() {
    // 앱 시작 시 성취 설정 초기화
    await this.achievementConfigService.initializeConfigs();
  }

  getHello(): string {
    return 'Hello World!';
  }
}
