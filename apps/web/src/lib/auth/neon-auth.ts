import 'server-only';

import { createNeonAuth, type NeonAuth } from '@neondatabase/auth/next/server';

type NeonSession = {
  data: { user: { id: string } } | null;
};

type SessionReader = () => Promise<NeonSession>;

let neonAuth: NeonAuth | undefined;

export function getNeonAuthConfig() {
  const baseUrl = process.env.candorlens_NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl || !cookieSecret || cookieSecret.length < 32) {
    throw new Error('Neon authentication configuration is missing.');
  }

  return { baseUrl, cookies: { secret: cookieSecret } };
}

export function getNeonAuth(): NeonAuth {
  neonAuth ??= createNeonAuth(getNeonAuthConfig());
  return neonAuth;
}

export async function getAuthenticatedUser(
  readSession: SessionReader = () => getNeonAuth().getSession(),
): Promise<{ sub: string } | null> {
  const { data } = await readSession();
  const id = data?.user.id;

  return typeof id === 'string' && id ? { sub: id } : null;
}
