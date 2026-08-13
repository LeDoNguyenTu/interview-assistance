'use server';

import { revalidatePath } from 'next/cache';

import type { ProviderSettingsFormState } from '../../../components/settings/provider-settings-form';
import {
  encryptProviderApiKey,
  CredentialEncryptionError,
} from '../../../data/provider-credentials/crypto';
import {
  CredentialInputError,
  parseProviderCredentialInput,
} from '../../../data/provider-credentials/input';
import {
  asProviderCredentialSql,
  saveProviderCredential,
} from '../../../data/provider-credentials/repository';
import { requireUser } from '../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../lib/neon/database';

export async function saveProviderSettings(
  _: ProviderSettingsFormState,
  formData: FormData,
): Promise<ProviderSettingsFormState> {
  const claims = await requireUser();

  try {
    const input = parseProviderCredentialInput({
      apiKey: formData.get('apiKey'),
      model: formData.get('model'),
      provider: formData.get('provider'),
    });
    const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    if (!encryptionKey) throw new CredentialEncryptionError();

    await saveProviderCredential(
      asProviderCredentialSql(getNeonSql()),
      claims,
      {
        encryptedApiKey: encryptProviderApiKey(
          { ownerId: claims.sub, provider: input.provider },
          input.apiKey,
          encryptionKey,
        ),
        keyHint: input.keyHint,
        model: input.model,
        provider: input.provider,
      },
    );
    revalidatePath('/settings');
    revalidatePath('/sessions/new');

    return {
      message: `${input.provider === 'openai' ? 'OpenAI' : 'Gemini'} is ready for your sessions.`,
      status: 'success',
    };
  } catch (error) {
    if (error instanceof CredentialInputError) {
      return { message: error.message, status: 'error' };
    }

    return {
      message: 'Unable to save this provider key. Please try again.',
      status: 'error',
    };
  }
}
