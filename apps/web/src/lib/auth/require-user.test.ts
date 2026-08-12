import { describe, expect, it, vi } from 'vitest';

vi.mock('./neon-auth.js', () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { requireUserForRoute } from './require-user.js';

const validClaims = {
  aud: 'authenticated',
  email: 'participant@example.com',
  role: 'authenticated',
  sub: '18df2b4e-5bf5-47b4-a278-9825882a9bc2',
};

describe('requireUserForRoute', () => {
  it('redirects an unauthenticated protected route to sign-in', async () => {
    const redirect = (path: string): never => {
      throw new Error(`redirect:${path}`);
    };

    await expect(
      requireUserForRoute(redirect, async () => null),
    ).rejects.toThrow('redirect:/sign-in');
  });

  it('returns the authenticated Neon user for a signed-in route', async () => {
    await expect(
      requireUserForRoute(
        () => {
          throw new Error('should not redirect');
        },
        async () => validClaims,
      ),
    ).resolves.toEqual(validClaims);
  });

  it('does not accept a missing authenticated user', async () => {
    await expect(
      requireUserForRoute(
        () => {
          throw new Error('redirect:/sign-in');
        },
        async () => null,
      ),
    ).rejects.toThrow('redirect:/sign-in');
  });
});
