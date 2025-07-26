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
}
