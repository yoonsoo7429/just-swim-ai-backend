import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  async signin(@Body() body: { email: string; password: string }) {
    return this.authService.signin(body.email, body.password);
  }

  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string; nickname?: string },
  ) {
    return this.authService.signup(body.email, body.password, body.nickname);
  }
}
