import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { firstValueFrom } from 'rxjs';

import { RegisterDto } from '../../../libs/dto/auth/register.dto.js';
import { AuthRepository, type RefreshTokenRecord } from './auth.repository.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwt: JwtService,
    @Inject('USERS_SERVICE')
    private readonly usersClient: ClientProxy,
  ) {}

  private generateRefreshToken() {
    return randomBytes(64).toString('hex');
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateFamilyId() {
    return randomUUID();
  }

  async register(data: RegisterDto) {
    const existingUser = await firstValueFrom(
      this.usersClient.send({ cmd: 'users.findByEmail' }, data.email),
    );

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await firstValueFrom(
      this.usersClient.send(
        { cmd: 'users.create' },
        {
          fullname: data.fullname,
          lastname: data.lastname,
          email: data.email,
          role: data.role,
        },
      ),
    );

    await this.authRepository.createCredential(user.id, passwordHash);

    return {
      id: user.id,
      fullname: user.fullname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    };
  }

  async login(data: { email: string; password: string; role: string }) {
    const user = await firstValueFrom(
      this.usersClient.send({ cmd: 'users.findByEmail' }, data.email),
    );

    if (!user) {
      throw new ConflictException('Invalid Credentials');
    }

    const credentials = await this.authRepository.findCredentialByUserId(user.id);

    if (!credentials) {
      throw new ConflictException('Invalid Credentials');
    }

    const passwordValid = await bcrypt.compare(data.password, credentials.passwordHash);

    if (!passwordValid) {
      throw new ConflictException('Invalid Credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const familyId = this.generateFamilyId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken({
      userId: user.id,
      familyId,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const storedToken: RefreshTokenRecord | null = await this.authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      await this.authRepository.revokeRefreshTokenFamily(storedToken.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.revokeRefreshTokenFamily(storedToken.familyId);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await firstValueFrom(
      this.usersClient.send({ cmd: 'users.findById' }, storedToken.userId),
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload);
    const nextRefreshToken = this.generateRefreshToken();
    const nextRefreshTokenHash = this.hashRefreshToken(nextRefreshToken);
    const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.markTokenReplaced(storedToken.tokenHash, nextRefreshTokenHash);
    await this.authRepository.createRefreshToken({
      userId: storedToken.userId,
      familyId: storedToken.familyId,
      tokenHash: nextRefreshTokenHash,
      expiresAt: nextExpiresAt,
    });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresAt: nextExpiresAt,
    };
  }

  async getRegisterData() {
    return this.authRepository.getRegisterData();
  }
}