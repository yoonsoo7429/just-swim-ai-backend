import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Body() createGoalDto: CreateGoalDto, @Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.goalsService.create(createGoalDto, user.userId);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.goalsService.findAll(user.userId);
  }

  @Get('stats')
  getStats(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.goalsService.getGoalStats(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.goalsService.findOne(+id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number; email: string };
    return this.goalsService.update(+id, updateGoalDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.goalsService.remove(+id, user.userId);
  }

  @Post('update-progress')
  updateProgress(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.goalsService.updateGoalProgress(user.userId);
  }
}
