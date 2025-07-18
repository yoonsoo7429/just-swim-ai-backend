import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Provider } from 'src/common/enum/provider.enum';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  /* JWT 생성 */
  async generateJwtToken(userId: number): Promise<string> {
    return this.jwtService.sign(
      { userId },
      {
        secret: process.env.JWT_SECRET,
      },
    );
  }

  /* 사용자 검증 */
  async validateUser(email: string, provider: Provider): Promise<User | null> {
    const user = await this.userRepository.findUserByEmail(email, provider);
    if (!user) return user;
    return user;
  }

  /* Pk로 조회 */
  async findUserByPk(userId: number): Promise<User> {
    return await this.userRepository.findUserByPk(userId);
  }

  /* 고객 정보 생성 */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return await this.userRepository.createUser(createUserDto);
  }
}
