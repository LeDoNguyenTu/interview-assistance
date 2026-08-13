import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  getStoredProviderCredential: vi.fn(),
}));

vi.mock('./repository.js', () => ({
  getStoredProviderCredential: dependencies.getStoredProviderCredential,
}));

import { resolveProviderRuntimeEnvironment } from './runtime.js';
import { encryptProviderApiKey } from './crypto.js';

const encryptionKey = Buffer.alloc(32, 9).toString('base64');

describe('resolveProviderRuntimeEnvironment', () => {
  it('uses a stored owner credential without mutating the process environment', async () => {
    dependencies.getStoredProviderCredential.mockResolvedValue({
      encryptedApiKey: encryptProviderApiKey(
        { ownerId: 'owner-1', provider: 'openai' },
        'owner-key',
        encryptionKey,
      ),
      keyHint: '7890',
      model: 'gpt-4.1-mini',
      provider: 'openai',
      updatedAt: '2026-08-14T00:00:00.000Z',
    });

    await expect(
      resolveProviderRuntimeEnvironment(vi.fn(), { sub: 'owner-1' }, 'openai', {
        CREDENTIAL_ENCRYPTION_KEY: encryptionKey,
        OPENAI_API_KEY: 'global-key',
        OPENAI_TEXT_MODEL: 'global-model',
      }),
    ).resolves.toMatchObject({
      OPENAI_API_KEY: 'owner-key',
      OPENAI_TEXT_MODEL: 'gpt-4.1-mini',
    });
  });

  it('keeps the server default when the owner has no saved provider key', async () => {
    dependencies.getStoredProviderCredential.mockResolvedValue(null);
    const environment = { OPENAI_API_KEY: 'global-key' };

    await expect(
      resolveProviderRuntimeEnvironment(
        vi.fn(),
        { sub: 'owner-1' },
        'openai',
        environment,
      ),
    ).resolves.toBe(environment);
  });
});
