import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  ClientProxy,
} from '@nestjs/microservices';

import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository.js';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from '../../../libs/dto/auth/register.dto.js';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwt: JwtService,
    @Inject('USERS_SERVICE')
    private readonly usersClient: ClientProxy,
  ) { }


  private generateRefereshToken() {
    return randomBytes(64).toString('hex');
  }

  private hasRefreshToken(token: string) {
    return createHash('sha256')
      .update(token)
      .digest('hex');
  }

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
    if (!user) {
      throw new ConflictException(
        'Invalid Credentials',
      );
    }

    const credentials = await this.authRepository.findCredentialByUserId(
      user.id,
    );

    if (!credentials) {
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
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = this.generateRefereshToken();

    const refreshTokenHash = this.hasRefreshToken(refreshToken);

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt
    })

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken : string){
    const tokenHash = this.hasRefreshToken(refreshToken)
    const storeToken = await this.authRepository.findRefreshToken(tokenHash);
    if(!storeToken){
      throw new UnauthorizedException(
        'Invalid refresh Token'
      )
    }

    if(storeToken.revokedAt){
      throw new UnauthorizedException(
        'Refresh token revoked'
      )
    }

    if(storeToken.expiresAt < new Date()){
      throw new UnauthorizedException(
        'Refresh token expire'
      )
    }

    const user = await firstValueFrom(
      this.usersClient.send(
        {cmd: 'users.findById'},
        storeToken.userId
      )
    )

    if(!user){
      throw new UnauthorizedException(
        'User not found'
      )
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      refreshToken
    }
  }

  async getRegisterData() {
    return this.authRepository.getRegisterData();
  }
}