import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';

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
}