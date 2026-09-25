import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  createCredential(
    userId: number,
    passwordHash: string,
  ) {
    return this.prisma.credential.create({
      data: {
        userId,
        passwordHash,
      },
    });
  }

  findCredentialByUserId(userId: number) {
    return this.prisma.credential.findUnique({
      where: {
        userId,
      },
    });
  }

  createRefreshToken(data: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  revokeRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.update({
      where: {
        tokenHash,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  getRegisterData() {
    return this.prisma.credential.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}