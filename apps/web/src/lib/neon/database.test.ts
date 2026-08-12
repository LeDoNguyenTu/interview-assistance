import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getNeonDatabaseUrl } from './database.js';

const originalDatabaseUrl = process.env.candorlens_DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.candorlens_DATABASE_URL;
  } else {
    process.env.candorlens_DATABASE_URL = originalDatabaseUrl;
  }
  vi.resetModules();
});

describe('getNeonDatabaseUrl', () => {
  it('rejects an absent server-only Neon database URL', () => {
    delete process.env.candorlens_DATABASE_URL;

    expect(() => getNeonDatabaseUrl()).toThrow(
      'Neon database configuration is missing.',
    );
  });

  it('returns the connected Neon database URL without altering it', () => {
    process.env.candorlens_DATABASE_URL =
      'postgresql://example.test/candorlens';

    expect(getNeonDatabaseUrl()).toBe('postgresql://example.test/candorlens');
  });
});
