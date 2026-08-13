import { getAuthenticatedUser } from './neon-auth';

export type ValidatedClaims = { email?: string; sub: string };

export async function requireUserForRoute(
  redirectToSignIn: (path: string) => never,
  getUser: () => Promise<ValidatedClaims | null> = getAuthenticatedUser,
): Promise<ValidatedClaims> {
  const claims = await getUser();

  if (!claims) {
    return redirectToSignIn('/sign-in');
  }

  return claims;
}
