import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { KakaoStrategy } from './strategy/kakao.strategy';

@Module({
  imports: [UserModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, JwtService, KakaoStrategy],
  exports: [AuthService, PassportModule, JwtService],
})
export class AuthModule {}
