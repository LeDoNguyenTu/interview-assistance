import { describe, expect, it } from 'vitest';

import { CredentialInputError, parseProviderCredentialInput } from './input.js';

describe('parseProviderCredentialInput', () => {
  it('normalises an account-owned provider credential without returning the raw key as a display value', () => {
    const result = parseProviderCredentialInput({
      apiKey: '  sk-12345678901234567890  ',
      model: ' gpt-4.1-mini ',
      provider: 'openai',
    });

    expect(result).toEqual({
      apiKey: 'sk-12345678901234567890',
      keyHint: '7890',
      model: 'gpt-4.1-mini',
      provider: 'openai',
    });
  });

  it('rejects fixture mode and incomplete credentials', () => {
    expect(() =>
      parseProviderCredentialInput({
        apiKey: 'short',
        model: '',
        provider: 'fixture',
      }),
    ).toThrow(CredentialInputError);
  });
});
