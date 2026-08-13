import type { ProviderId } from '@candorlens/core';

export type ConfigurableProvider = Exclude<ProviderId, 'fixture'>;

export type ProviderCredentialInput = {
  apiKey: string;
  keyHint: string;
  model: string;
  provider: ConfigurableProvider;
};

export class CredentialInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CredentialInputError';
  }
}

export function parseProviderCredentialInput(
  input: unknown,
): ProviderCredentialInput {
  if (typeof input !== 'object' || input === null) {
    throw new CredentialInputError('Enter valid provider settings.');
  }

  const candidate = input as {
    apiKey?: unknown;
    model?: unknown;
    provider?: unknown;
  };
  const apiKey =
    typeof candidate.apiKey === 'string' ? candidate.apiKey.trim() : '';
  const model =
    typeof candidate.model === 'string' ? candidate.model.trim() : '';
  const provider = candidate.provider;

  if (provider !== 'openai' && provider !== 'gemini') {
    throw new CredentialInputError('Choose a supported provider.');
  }
  if (apiKey.length < 16 || apiKey.length > 1024) {
    throw new CredentialInputError('Enter a valid API key.');
  }
  if (
    model.length === 0 ||
    model.length > 128 ||
    !/^[a-zA-Z0-9._:/-]+$/.test(model)
  ) {
    throw new CredentialInputError('Enter a valid model name.');
  }

  return {
    apiKey,
    keyHint: apiKey.slice(-4),
    model,
    provider,
  };
}
