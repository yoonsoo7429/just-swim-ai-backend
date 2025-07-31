import {
  Controller,
  UseGuards,
  Post,
  Body,
  Req,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WearableService } from './wearable.service';
import { WearableProvider } from './entities/wearable-connection.entity';
import { Request } from 'express';
import { ConnectWearableDto, SyncWearableDto } from './dto/wearable.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('wearable')
export class WearableController {
  constructor(private readonly wearableService: WearableService) {}

  // 웨어러블 기기 연결
  @Post('connect')
  async connectWearable(
    @Body() connectDto: ConnectWearableDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.wearableService.connectWearable(user.userId, connectDto);
  }

  // 웨어러블 기기 연결 해제
  @Delete('disconnect/:provider')
  async disconnectWearable(
    @Param('provider') provider: WearableProvider,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.wearableService.disconnectWearable(user.userId, provider);
  }

  // 사용자의 웨어러블 기기 연결 목록 조회
  @Get('connections')
  async getUserConnections(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.wearableService.getUserConnections(user.userId);
  }

  // 웨어러블 데이터 동기화
  @Post('sync')
  async syncWearableData(
    @Body() syncDto: SyncWearableDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.wearableService.syncWearableData(user.userId, syncDto);
  }

  // 웨어러블 통계 조회
  @Get('stats/:provider')
  async getWearableStats(
    @Param('provider') provider: WearableProvider,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.wearableService.getWearableStats(user.userId, provider);
  }

  // 지원하는 웨어러블 기기 목록 조회
  @Get('providers')
  async getSupportedProviders() {
    return {
      providers: [
        {
          id: WearableProvider.APPLE_HEALTH,
          name: 'Apple Health',
          description: 'iPhone 및 Apple Watch와 연동',
          icon: '🍎',
          features: ['자동 데이터 수집', '심박수 모니터링', 'GPS 추적'],
        },
        {
          id: WearableProvider.GOOGLE_FIT,
          name: 'Google Fit',
          description: 'Android 기기 및 Wear OS와 연동',
          icon: '🤖',
          features: ['자동 데이터 수집', '활동 추적', '건강 데이터 통합'],
        },
        {
          id: WearableProvider.GARMIN_CONNECT,
          name: 'Garmin Connect',
          description: 'Garmin 스포츠 워치와 연동',
          icon: '🏃',
          features: ['정밀한 수영 데이터', '스트로크 분석', '고급 메트릭'],
        },
        {
          id: WearableProvider.FITBIT,
          name: 'Fitbit',
          description: 'Fitbit 기기와 연동',
          icon: '📊',
          features: ['활동 추적', '수면 분석', '심박수 모니터링'],
        },
        {
          id: WearableProvider.STRAVA,
          name: 'Strava',
          description: '다양한 기기와 연동 가능',
          icon: '🏊',
          features: ['소셜 기능', '경로 추적', '성과 분석'],
        },
      ],
    };
  }
}
