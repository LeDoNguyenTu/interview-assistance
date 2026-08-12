import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@neondatabase/auth/next/server', () => ({
  createNeonAuth: vi.fn(),
}));

import { getAuthenticatedUser, getNeonAuthConfig } from './neon-auth.js';

const originalBaseUrl = process.env.candorlens_NEON_AUTH_BASE_URL;
const originalCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

afterEach(() => {
  if (originalBaseUrl === undefined) {
    delete process.env.candorlens_NEON_AUTH_BASE_URL;
  } else {
    process.env.candorlens_NEON_AUTH_BASE_URL = originalBaseUrl;
  }
  if (originalCookieSecret === undefined) {
    delete process.env.NEON_AUTH_COOKIE_SECRET;
  } else {
    process.env.NEON_AUTH_COOKIE_SECRET = originalCookieSecret;
  }
});

describe('Neon Auth server configuration', () => {
  it('rejects missing server-only configuration', () => {
    delete process.env.candorlens_NEON_AUTH_BASE_URL;
    delete process.env.NEON_AUTH_COOKIE_SECRET;

    expect(() => getNeonAuthConfig()).toThrow(
      'Neon authentication configuration is missing.',
    );
  });

  it('normalizes a signed-in Neon user to the existing owner shape', async () => {
    const owner = await getAuthenticatedUser(async () => ({
      data: { user: { id: 'neon-user-1' } },
    }));

    expect(owner).toEqual({ sub: 'neon-user-1' });
  });

  it('returns null when a Neon session has no user', async () => {
    const owner = await getAuthenticatedUser(async () => ({ data: null }));

    expect(owner).toBeNull();
  });
});
