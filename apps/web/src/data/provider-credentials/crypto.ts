import 'server-only';

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from 'node:crypto';

export type CredentialEncryptionContext = {
  ownerId: string;
  provider: 'gemini' | 'openai';
};

export class CredentialEncryptionError extends Error {
  constructor() {
    super('Unable to read the stored provider credential.');
    this.name = 'CredentialEncryptionError';
  }
}

function decodedKey(value: string): Buffer {
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) throw new CredentialEncryptionError();
  return key;
}

function additionalData(context: CredentialEncryptionContext): Buffer {
  return Buffer.from(
    `candorlens.provider-credential.v1:${context.ownerId}:${context.provider}`,
    'utf8',
  );
}

function encoded(parts: Buffer[]): string {
  return parts.map((part) => part.toString('base64url')).join('.');
}

function decoded(value: string): Buffer[] {
  const parts = value.split('.');
  if (parts.length !== 4 || parts.some((part) => !part)) {
    throw new CredentialEncryptionError();
  }

  try {
    return parts.map((part) => Buffer.from(part, 'base64url'));
  } catch {
    throw new CredentialEncryptionError();
  }
}

export function encryptProviderApiKey(
  context: CredentialEncryptionContext,
  apiKey: string,
  base64EncryptionKey: string,
): string {
  try {
    const nonce = randomBytes(12);
    const cipher: CipherGCM = createCipheriv(
      'aes-256-gcm',
      decodedKey(base64EncryptionKey),
      nonce,
    );
    cipher.setAAD(additionalData(context));
    const ciphertext = Buffer.concat([
      cipher.update(apiKey, 'utf8'),
      cipher.final(),
    ]);
    return encoded([nonce, cipher.getAuthTag(), ciphertext, Buffer.from('v1')]);
  } catch (error) {
    if (error instanceof CredentialEncryptionError) throw error;
    throw new CredentialEncryptionError();
  }
}

export function decryptProviderApiKey(
  context: CredentialEncryptionContext,
  encryptedApiKey: string,
  base64EncryptionKey: string,
): string {
  try {
    const parts = decoded(encryptedApiKey);
    const nonce = parts[0];
    const authTag = parts[1];
    const ciphertext = parts[2];
    const version = parts[3];
    if (
      !nonce ||
      !authTag ||
      !ciphertext ||
      !version ||
      nonce.length !== 12 ||
      authTag.length !== 16 ||
      version.toString() !== 'v1'
    ) {
      throw new CredentialEncryptionError();
    }

    const decipher: DecipherGCM = createDecipheriv(
      'aes-256-gcm',
      decodedKey(base64EncryptionKey),
      nonce,
    );
    decipher.setAAD(additionalData(context));
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    if (error instanceof CredentialEncryptionError) throw error;
    throw new CredentialEncryptionError();
  }
}
