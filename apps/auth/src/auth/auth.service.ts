import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return {
      message: 'Password hashed successfully',
    };
  }
}