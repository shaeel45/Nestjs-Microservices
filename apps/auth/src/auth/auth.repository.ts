import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export type RefreshTokenRecord = {
  id: string;
  userId: number;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenHash?: string | null;
  createdAt: Date;
};

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
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
    replacedByTokenHash?: string | null;
  }): Promise<RefreshTokenRecord> {
    return this.prisma.refreshToken.create({
      data,
    }) as Promise<RefreshTokenRecord>;
  }

  findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    }) as Promise<RefreshTokenRecord | null>;
  }

  markTokenReplaced(tokenHash: string, nextTokenHash: string) {
    return this.prisma.refreshToken.update({
      where: {
        tokenHash,
      },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: nextTokenHash,
      },
    });
  }

  revokeRefreshTokenFamily(familyId: string) {
    return this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
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