import { Controller, UseGuards, Post, Body, Req, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecordsService } from './records.service';
import { Request } from 'express';
import { CreateRecordDto } from './dto/create-record.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  async createRecord(@Body() body: CreateRecordDto, @Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recordsService.create(body, user.userId);
  }

  @Get()
  async getMyRecords(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recordsService.findByUserId(user.userId);
  }

  @Get('stats')
  async getUserStats(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recordsService.getUserStats(user.userId);
  }

  @Get('stats/style')
  async getStyleStats(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recordsService.getStyleStats(user.userId);
  }

  @Get('personal-bests')
  async getPersonalBests(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recordsService.getPersonalBests(user.userId);
  }

  @Get('weekly-stats')
  async getWeeklyStats(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recordsService.getWeeklyStats(user.userId);
  }

  @Get('analysis')
  async getDetailedAnalysis(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.recordsService.getAnalysis(user.userId);
  }
}
