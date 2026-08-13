import { describe, expect, it } from 'vitest';

import { shouldAuthenticateAtProxy } from './proxy-config.js';

describe('protected route proxy authentication', () => {
  it('protects page requests while allowing Server Actions to authorize themselves', () => {
    expect(shouldAuthenticateAtProxy(new Headers())).toBe(true);
    expect(
      shouldAuthenticateAtProxy(
        new Headers({ 'next-action': 'create-session-action-id' }),
      ),
    ).toBe(false);
  });
});
