import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { envVariables } from 'src/common/const/env.const';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const skipAuth = this.reflector.get<boolean>(
      'skipAuth',
      context.getHandler(),
    );
    if (skipAuth) return true;

    const cookieToken = request.cookies.authorization;
    const headerToken = request.headers.authorization;
    const authorization = cookieToken ? `Bearer ${cookieToken}` : headerToken;

    if (!authorization) {
      throw new UnauthorizedException('로그인이 필요한 기능입니다.');
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('잘못된 인증 형식입니다.');
    }

    try {
      const { userId } = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(envVariables.accessTokenSecret),
      });

      const user = await this.authService.findUserByPk(userId);
      if (!user) {
        throw new NotFoundException('회원 정보가 없습니다.');
      }

      request.user = user;
      response.locals.user = user;
      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('accessToken이 만료되었습니다.');
      }

      throw new UnauthorizedException('토큰이 유효하지 않습니다.');
    }
  }
}
