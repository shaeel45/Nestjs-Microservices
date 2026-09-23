import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
} from '@nestjs/common';
import {RegisterDto} from '../../../libs/dto/auth/register.dto.js';
import { ClientProxy } from '@nestjs/microservices';
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authClient.send(
      { cmd: 'auth.register' },
      dto,
    );
  }

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.authClient.send(
      { cmd: 'auth.login' },
      data,
    );
  }

  @Get('register')
  getRegisterData() {
    return this.authClient.send(
      { cmd: 'auth.getRegisterData' },
      {},
    );
  }


}