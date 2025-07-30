import { Controller, UseGuards, Post, Body, Req, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecommendService } from './recommend.service';
import { Request } from 'express';
import { RecommendRequestDto } from './dto/recommend.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Post()
  async getRecommendation(
    @Body() body: RecommendRequestDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.recommendService.recommend(body, user.userId);
  }

  @Get()
  async getMyRecommendations(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recommendService.findByUserId(user.userId);
  }

  @Get('profile')
  async getUserProfile(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recommendService.analyzeUserProfile(user.userId);
  }

  @Get('stats')
  async getRecommendationStats(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recommendService.getRecommendationStats(user.userId);
  }
}
