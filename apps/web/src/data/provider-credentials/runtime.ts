import 'server-only';

import { decryptProviderApiKey } from './crypto';
import type { ConfigurableProvider } from './input';
import {
  getStoredProviderCredential,
  type ProviderCredentialSql,
} from './repository';

type Owner = { sub: string };
type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

export async function resolveProviderRuntimeEnvironment(
  sql: ProviderCredentialSql,
  owner: Owner,
  provider: ConfigurableProvider,
  environment: ProviderEnvironment,
): Promise<ProviderEnvironment> {
  const credential = await getStoredProviderCredential(sql, owner, provider);
  if (!credential) return environment;

  const encryptionKey = environment.CREDENTIAL_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('Provider credential encryption is not configured.');
  }

  const apiKey = decryptProviderApiKey(
    { ownerId: owner.sub, provider },
    credential.encryptedApiKey,
    encryptionKey,
  );

  return provider === 'openai'
    ? {
        ...environment,
        OPENAI_API_KEY: apiKey,
        OPENAI_TEXT_MODEL: credential.model,
      }
    : {
        ...environment,
        GEMINI_API_KEY: apiKey,
        GEMINI_TEXT_MODEL: credential.model,
      };
}
