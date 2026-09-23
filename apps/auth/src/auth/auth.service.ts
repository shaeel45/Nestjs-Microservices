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

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    @Inject('USERS_SERVICE')
    private readonly usersClient: ClientProxy,
  ) {}

  async register(data: {
    name: string;
    email: string;
    password: string;
  }) {
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
          name: data.name,
          email: data.email,
        },
      )
    );

    await this.authRepository.createCredential(
      user.id,
      passwordHash,
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async login(data: {
    email: string;
    password: string;
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

        return {
          userId: user.id,
          email: user.email,
        };
      }

  async getRegisterData() {
    return this.authRepository.getRegisterData();
  }
}