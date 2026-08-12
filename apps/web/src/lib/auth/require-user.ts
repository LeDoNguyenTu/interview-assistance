export type ValidatedClaims = Record<string, unknown> & { sub: string };

type ClaimsClient = {
  auth: {
    getClaims: () => Promise<{
      data: { claims: unknown | null } | null;
      error: unknown;
    }>;
  };
};

function isValidatedClaims(value: unknown): value is ValidatedClaims {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { sub?: unknown }).sub === 'string'
  );
}

export async function getValidatedClaims(
  client: ClaimsClient,
): Promise<ValidatedClaims | null> {
  const { data, error } = await client.auth.getClaims();

  if (error || !isValidatedClaims(data?.claims)) {
    return null;
  }

  return data.claims;
}

export async function requireUserForRoute(
  client: ClaimsClient,
  redirectToSignIn: (path: string) => never,
): Promise<ValidatedClaims> {
  const claims = await getValidatedClaims(client);

  if (!claims) {
    return redirectToSignIn('/sign-in');
  }

  return claims;
}
