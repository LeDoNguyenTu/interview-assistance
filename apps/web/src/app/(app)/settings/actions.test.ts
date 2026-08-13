import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('../../../lib/auth/require-user-server.js', () => ({
  requireUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../lib/neon/database.js', () => ({ getNeonSql: vi.fn() }));
vi.mock('../../../lib/auth/neon-auth.js', () => ({
  getNeonAuth: vi.fn().mockReturnValue({ signOut: vi.fn() }),
}));
vi.mock('../../../data/provider-credentials/crypto.js', () => ({
  encryptProviderApiKey: vi.fn().mockReturnValue('opaque-ciphertext'),
}));
vi.mock('../../../data/provider-credentials/repository.js', () => ({
  asProviderCredentialSql: vi.fn().mockReturnValue('provider-sql'),
  saveProviderCredential: vi.fn().mockResolvedValue(undefined),
}));

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getNeonAuth } from '../../../lib/auth/neon-auth';
import { saveProviderSettings, signOut } from './actions';
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

describe('signOut', () => {
  it('ends the Neon session before returning to sign-in', async () => {
    const auth = getNeonAuth();

    await signOut();

    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith('/sign-in');
  });
});
