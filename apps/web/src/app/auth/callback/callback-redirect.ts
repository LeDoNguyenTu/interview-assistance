const callbackDestinations = new Set(['/dashboard']);

export function getSafeCallbackRedirectPath(nextPath: string | null): string {
  return nextPath !== null && callbackDestinations.has(nextPath) ? nextPath : '/dashboard';
}
