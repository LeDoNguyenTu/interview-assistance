import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { decryptProviderApiKey, encryptProviderApiKey } from './crypto.js';

const encryptionKey = Buffer.alloc(32, 7).toString('base64');

describe('provider credential encryption', () => {
  it('round-trips a key without preserving its plaintext in storage', () => {
    const key = 'sk-user-owned-key-that-must-never-be-displayed';
    const encrypted = encryptProviderApiKey(
      { ownerId: 'owner-1', provider: 'openai' },
      key,
      encryptionKey,
    );

    expect(encrypted).not.toContain(key);
    expect(
      decryptProviderApiKey(
        { ownerId: 'owner-1', provider: 'openai' },
        encrypted,
        encryptionKey,
      ),
    ).toBe(key);
  });

  it('rejects ciphertext when the owning user does not match', () => {
    const encrypted = encryptProviderApiKey(
      { ownerId: 'owner-1', provider: 'gemini' },
      'user-owned-gemini-key',
      encryptionKey,
    );

    expect(() =>
      decryptProviderApiKey(
        { ownerId: 'owner-2', provider: 'gemini' },
        encrypted,
        encryptionKey,
      ),
    ).toThrow('Unable to read the stored provider credential.');
  });
});
