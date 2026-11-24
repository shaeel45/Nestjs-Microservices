import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
} from '@nestjs/common';
import { RegisterDto } from '../../../libs/dto/auth/register.dto.js';
import { ClientProxy } from '@nestjs/microservices';
import { Public } from './decorators/public.decorators.js';
import { RefreshTokenDto } from '../../../libs/dto/auth/refreshToken.dto.js';
import { sendRpc } from '../../../libs/rpc/rpc-client.util.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
  ) {}

  //POST: auth/register
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return sendRpc(this.authClient, 'auth.register', dto);
  }

  //POST: auth/login
  @Public()
  @Post('login')
  login(@Body() data: { email: string; password: string; role?: string }) {
    return sendRpc(this.authClient, 'auth.login', {
      ...data,
      role: data.role || 'CUSTOMER',
    });
  }

  //POST: auth/refresh
  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return sendRpc(this.authClient, 'auth.RefreshToken', {
      refreshToken: dto.refreshToken,
    });
  }

  //GET: auth/register
  @Public()
  @Get('register')
  getRegisterData() {
    return sendRpc(this.authClient, 'auth.getRegisterData', {});
  }
}
