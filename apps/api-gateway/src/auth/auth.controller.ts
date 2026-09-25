import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
} from '@nestjs/common';
import {RegisterDto} from '../../../libs/dto/auth/register.dto.js';
import { ClientProxy } from '@nestjs/microservices';
import { Public } from './decorators/public.decorators.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import {RefreshTokenDto} from '../../../libs/dto/auth/refreshToken.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
  ) {}
 
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authClient.send(
      { cmd: 'auth.register' },
      dto,
    );
  }

  @Public()
  @Post('login')
  login(@Body() data: { email: string; password: string, role: string }) {
    return this.authClient.send(
      { cmd: 'auth.login' },
      data,
    );
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto){
    return this.authClient.send({
      cmd: 'auth.RefreshToken'
    }, { refreshToken: dto.refreshToken })
  }

  @Get('register')
  getRegisterData() {
    return this.authClient.send(
      { cmd: 'auth.getRegisterData' },
      {},
    );
  }


}