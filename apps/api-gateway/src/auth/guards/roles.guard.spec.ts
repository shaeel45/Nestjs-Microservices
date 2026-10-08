import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { RolesGuard } from './roles.guard.js';
import { Role } from '../enums/role.enums.js';

describe('RolesGuard', () => {
  it('allows a user when their role matches the required role', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.ADMIN } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when a CUSTOMER hits an ADMIN-only route', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.CUSTOMER } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
