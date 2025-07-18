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
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { SkipAuth } from './decorator/skip-auth.decorator';
import { KakaoAuthGuard } from './guard/kakao.guard';
import { Request, Response } from 'express';
import { Provider } from 'src/common/enum/provider.enum';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /* kakao SignIn */
  @SkipAuth()
  @UseGuards(KakaoAuthGuard)
  @Get('oauth/kakao')
  async kakaoSignin(): Promise<void> {
    return;
  }

  @SkipAuth()
  @UseGuards(KakaoAuthGuard)
  @Get('oauth/kakao/callback')
  async kakaoCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    let profile: any = req.user;
    let provider: Provider = profile.provider;
    let name: string = profile._json.kakao_account.nickname;
    let email: string = profile._json.kakao_account.email;

    const exUser = await this.authService.validateUser(email, provider);
    if (exUser) {
      const token = await this.authService.generateJwtToken(exUser.userId);
      const query = '?token=' + token;
      res.redirect(process.env.SELECT_HOME_URI + `/${query}`);
    }

    if (exUser === null) {
      const newUserData: CreateUserDto = {
        provider,
        email,
        name,
      };
      const newUser = await this.authService.createUser(newUserData);
      const token = await this.authService.generateJwtToken(newUser.userId);
      const query = '?token=' + token;
      res.redirect(process.env.SELECT_HOME_URI + `/${query}`);
    }
  }
}
