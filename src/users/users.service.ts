import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      nickname: createUserDto.nickname,
    });

    const savedUser = await this.usersRepository.save(user);

    const { password, ...result } = savedUser;
    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['records', 'achievements', 'goals'],
    });
  }

  async getUserStats(userId: number) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const totalRecords = user.records?.length || 0;
    const totalAchievements = user.achievements?.length || 0;
    const totalGoals = user.goals?.length || 0;
    const completedGoals =
      user.goals?.filter((goal) => goal.isCompleted).length || 0;

    return {
      totalRecords,
      totalAchievements,
      totalGoals,
      completedGoals,
      goalCompletionRate:
        totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
    };
  }
}
