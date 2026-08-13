import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getProviderAvailability } from './providers.js';

describe('getProviderAvailability', () => {
  it('keeps fixture available and reports unavailable live providers without exposing keys or model IDs', () => {
    const providers = getProviderAvailability({
      GEMINI_API_KEY: undefined,
      GEMINI_TEXT_MODEL: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_TEXT_MODEL: undefined,
    });

    expect(providers).toEqual([
      {
        available: true,
        id: 'fixture',
        label: 'Fixture preview',
        reason: null,
      },
      {
        available: false,
        id: 'openai',
        label: 'OpenAI',
        reason: 'Add an OpenAI key in Settings to enable it.',
      },
      {
        available: false,
        id: 'gemini',
        label: 'Gemini',
        reason: 'Add a Gemini key in Settings to enable it.',
      },
    ]);
    expect(JSON.stringify(providers)).not.toMatch(/api[_-]?key|model/i);
  });

  it('marks a live provider available only when its key and model are both configured', () => {
    const providers = getProviderAvailability({
      GEMINI_API_KEY: 'gemini-secret',
      GEMINI_TEXT_MODEL: 'gemini-2.5-flash',
      OPENAI_API_KEY: 'openai-secret',
      OPENAI_TEXT_MODEL: undefined,
    });

    expect(
      providers.find((provider) => provider.id === 'gemini'),
    ).toMatchObject({ available: true, reason: null });
    expect(
      providers.find((provider) => provider.id === 'openai'),
    ).toMatchObject({ available: false });
  });

  it('makes a provider available for the current user when a saved credential exists', () => {
    const providers = getProviderAvailability(
      {
        GEMINI_API_KEY: undefined,
        GEMINI_TEXT_MODEL: undefined,
        OPENAI_API_KEY: undefined,
        OPENAI_TEXT_MODEL: undefined,
      },
      ['openai'],
    );

    expect(
      providers.find((provider) => provider.id === 'openai'),
    ).toMatchObject({ available: true, reason: null });
  });
});
