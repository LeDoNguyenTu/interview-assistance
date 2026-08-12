import { describe, expect, it } from 'vitest';

import { getSafeCallbackRedirectPath } from './callback-redirect.js';

describe('getSafeCallbackRedirectPath', () => {
  it('allows the dashboard callback destination', () => {
    expect(getSafeCallbackRedirectPath('/dashboard')).toBe('/dashboard');
  });

  it.each([
    '/\\evil.example',
    '//evil.example',
    '/%5cevil.example',
    '/%5Cevil.example',
    '/%2f%2fevil.example',
    '/%2F%2Fevil.example',
    '/%255cevil.example',
  ])('rejects an unsafe callback destination: %s', (nextPath) => {
    expect(getSafeCallbackRedirectPath(nextPath)).toBe('/dashboard');
  });
});
