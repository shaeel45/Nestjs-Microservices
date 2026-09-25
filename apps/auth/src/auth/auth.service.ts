import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  ClientProxy,
} from '@nestjs/microservices';

import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository.js';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from '../../../libs/dto/auth/register.dto.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwt : JwtService,
    @Inject('USERS_SERVICE')
    private readonly usersClient: ClientProxy,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await firstValueFrom(
      this.usersClient.send(
        { cmd: 'users.findByEmail' },
        data.email,
      )
    );

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      12,
    );

    const user = await firstValueFrom(
      this.usersClient.send(
        { cmd: 'users.create' },
        {
          fullname: data.fullname,
          lastname: data.lastname,
          email: data.email,
          role: data.role,
        },
      )
    );

    await this.authRepository.createCredential(
      user.id,
      passwordHash,
    );

    return {
      id: user.id,
      fullname: user.fullname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    };
  }

  async login(data: {
    email: string;
    password: string;
    role: string;
  }) {
      const user = await firstValueFrom(
          this.usersClient.send(
              { cmd: 'users.findByEmail' },
              data.email,
            )
        );
        if(!user) {
          throw new ConflictException(
            'Invalid Credentials',
          );
        }

        const credentials = await this.authRepository.findCredentialByUserId(
          user.id,
        );

        if(!credentials) {
          throw new ConflictException(
            'Invalid Credentials',
          );
        }

        const passwordValid = await bcrypt.compare(
          data.password,
          credentials.passwordHash,
        );

        if (!passwordValid) {
          throw new ConflictException(
            'Invalid Credentials',
          );
        }

        const payload = {
          sub : user.id,
          email: user.email,
          role: user.role,
        }

        const accessToken = await this.jwt.signAsync(payload);
        return {
          user: {
        id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
          },
          accessToken,
        };
      }



  async getRegisterData() {
    return this.authRepository.getRegisterData();
  }
}