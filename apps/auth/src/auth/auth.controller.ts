import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from './auth.service.js';
import { RegisterDto } from '../../../libs/dto/auth/register.dto.js';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @MessagePattern({ cmd: 'auth.register' })
  register(data: RegisterDto) {
    return this.authService.register(data);
  }

  @MessagePattern({ cmd: 'auth.login' })
  login(data: { email: string; password: string, role: string }) {
    return this.authService.login(data);
  }

  @MessagePattern({ cmd: 'auth.getRegisterData' })
  getRegisterData() {
    return this.authService.getRegisterData();
  }
}