import { Controller, UseGuards, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getUserAchievements(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.achievementsService.getUserAchievements(user.userId);
  }

  @Get('unlocked')
  async getUnlockedAchievements(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.achievementsService.getUnlockedAchievements(user.userId);
  }

  @Get('stats')
  async getAchievementStats(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.achievementsService.getAchievementStats(user.userId);
  }

  @Get('check')
  async checkAchievements(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.achievementsService.checkAndCreateAchievements(user.userId);
  }
}
