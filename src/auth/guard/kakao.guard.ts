import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  constructor() {
    super(); // Guard의 super를 통해 AuthGuard('kakao') 클래스 생성자를 실행 ==> KakaoStrategy 클래스
  }
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      throw err;
    }
    return user;
  }
}
