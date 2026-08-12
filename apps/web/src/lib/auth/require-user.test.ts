import { describe, expect, it } from 'vitest';

import { getValidatedClaims, requireUserForRoute } from './require-user.js';

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
      requireUserForRoute(
        {
          auth: {
            getClaims: async () => ({ data: { claims: null }, error: null }),
          },
        },
        redirect,
      ),
    ).rejects.toThrow('redirect:/sign-in');
  });

  it('returns the claims Supabase validates for a signed-in route', async () => {
    await expect(
      requireUserForRoute(
        {
          auth: {
            getClaims: async () => ({
              data: { claims: validClaims },
              error: null,
            }),
          },
        },
        () => {
          throw new Error('should not redirect');
        },
      ),
    ).resolves.toEqual(validClaims);
  });

  it('does not accept a cookie-shaped session when Supabase returns invalid claims', async () => {
    const cookieShapedSession = {
      access_token: 'not-trusted',
      user: { user_metadata: { role: 'admin' } },
    };

    await expect(
      getValidatedClaims({
        auth: {
          getClaims: async () => ({
            data: {
              claims: cookieShapedSession as unknown as typeof validClaims,
            },
            error: null,
          }),
        },
      }),
    ).resolves.toBeNull();
  });

  it('does not fall back to cookie presence when Supabase returns no claims', async () => {
    const cookiePresent = true;

    const clientWithCookie = {
      auth: {
        getClaims: async () => ({ data: { claims: null }, error: null }),
      },
      cookiePresent,
    };

    await expect(getValidatedClaims(clientWithCookie)).resolves.toBeNull();
  });
});
