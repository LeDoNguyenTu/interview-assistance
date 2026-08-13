import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../../../lib/auth/require-user-server.js', () => ({
  requireUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../lib/neon/database.js', () => ({ getNeonSql: vi.fn() }));
vi.mock('../../../data/provider-credentials/crypto.js', () => ({
  encryptProviderApiKey: vi.fn().mockReturnValue('opaque-ciphertext'),
}));
vi.mock('../../../data/provider-credentials/repository.js', () => ({
  asProviderCredentialSql: vi.fn().mockReturnValue('provider-sql'),
  saveProviderCredential: vi.fn().mockResolvedValue(undefined),
}));

import { revalidatePath } from 'next/cache';

import { saveProviderSettings } from './actions';
import { saveProviderCredential } from '../../../data/provider-credentials/repository';

describe('saveProviderSettings', () => {
  it('encrypts a signed-in owner key before the owner-scoped save', async () => {
    const previousKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    process.env.CREDENTIAL_ENCRYPTION_KEY = 'test-encryption-key';
    const formData = new FormData();
    formData.set('apiKey', 'sk-12345678901234567890');
    formData.set('model', 'gpt-4.1-mini');
    formData.set('provider', 'openai');

    try {
      await expect(
        saveProviderSettings({ message: null, status: 'idle' }, formData),
      ).resolves.toEqual({
        message: 'OpenAI is ready for your sessions.',
        status: 'success',
      });

      expect(saveProviderCredential).toHaveBeenCalledWith(
        'provider-sql',
        { sub: 'owner-1' },
        expect.objectContaining({
          encryptedApiKey: 'opaque-ciphertext',
          keyHint: '7890',
          model: 'gpt-4.1-mini',
          provider: 'openai',
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith('/sessions/new');
    } finally {
      if (previousKey === undefined) {
        delete process.env.CREDENTIAL_ENCRYPTION_KEY;
      } else {
        process.env.CREDENTIAL_ENCRYPTION_KEY = previousKey;
      }
    }
  });
});
