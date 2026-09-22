import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from './auth.service.js';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @MessagePattern({ cmd: 'auth.register' })
  register(data: {
    name: string;
    email: string;
    password: string;
  }) {
    return this.authService.register(data);
  }
}