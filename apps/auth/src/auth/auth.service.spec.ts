import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { AuthService } from './auth.service.js';

const makeService = () => {
  const authRepository = {
    findRefreshToken: vi.fn(),
    createRefreshToken: vi.fn(),
    markTokenReplaced: vi.fn(),
    revokeRefreshTokenFamily: vi.fn(),
    findCredentialByUserId: vi.fn(),
  };

  const jwt = {
    signAsync: vi.fn(),
  };

  const usersClient = {
    send: vi.fn(),
  };

  return {
    service: new AuthService(authRepository as any, jwt as any, usersClient as any),
    authRepository,
    jwt,
    usersClient,
  };
};

describe('AuthService refresh token rotation', () => {
  it('rotates the refresh token and creates a replacement when the current token is valid', async () => {
    const { service, authRepository, jwt, usersClient } = makeService();

    authRepository.findRefreshToken.mockResolvedValue({
      userId: 7,
      familyId: 'family-1',
      tokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    usersClient.send.mockReturnValue(of({
      id: 7,
      email: 'admin@example.com',
      role: 'ADMIN',
    }));

    jwt.signAsync.mockResolvedValue('new-access-token');
    authRepository.createRefreshToken.mockResolvedValue({});
    authRepository.markTokenReplaced.mockResolvedValue({});

    const result = await service.refresh('valid-old-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(authRepository.markTokenReplaced).toHaveBeenCalledWith('old-hash', expect.any(String));
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        familyId: 'family-1',
      }),
    );
  });

  it('revokes the entire token family if a previously rotated refresh token is reused', async () => {
    const { service, authRepository, usersClient } = makeService();

    authRepository.findRefreshToken.mockResolvedValue({
      userId: 7,
      familyId: 'family-1',
      tokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    usersClient.send.mockReturnValue(of({
      id: 7,
      email: 'admin@example.com',
      role: 'ADMIN',
    }));

    await expect(service.refresh('reused-old-refresh-token')).rejects.toThrow(UnauthorizedException);
    expect(authRepository.revokeRefreshTokenFamily).toHaveBeenCalledWith('family-1');
  });
});
