import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Provider } from 'src/common/enum/provider.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  /* email로 조회 */
  async findUserByEmail(email: string, provider: Provider): Promise<User> {
    return await this.userRepository.findOne({ where: { email, provider } });
  }

  /* pk로 조회 */
  async findUserByPk(userId: number): Promise<User> {
    return await this.userRepository.findOne({
      where: { userId },
    });
  }

  /* 회원 가입 */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return await this.userRepository.save(createUserDto);
  }
}
