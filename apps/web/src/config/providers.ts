import 'server-only';

import type { ProviderId } from '@candorlens/core';

import type { ProviderAvailability } from './provider-types.js';
import type { ConfigurableProvider } from '../data/provider-credentials/input.js';

type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

function configured(...values: Array<string | undefined>): boolean {
  return values.every((value) => value?.trim());
}

export function getProviderAvailability(
  environment: ProviderEnvironment,
  savedProviders: readonly ConfigurableProvider[] = [],
): ProviderAvailability[] {
  const hasSavedOpenAi = savedProviders.includes('openai');
  const hasSavedGemini = savedProviders.includes('gemini');
  const openAiAvailable =
    hasSavedOpenAi ||
    configured(environment.OPENAI_API_KEY, environment.OPENAI_TEXT_MODEL);
  const geminiAvailable =
    hasSavedGemini ||
    configured(environment.GEMINI_API_KEY, environment.GEMINI_TEXT_MODEL);

  return [
    {
      available: true,
      id: 'fixture',
      label: 'Fixture preview',
      reason: null,
    },
    {
      available: openAiAvailable,
      id: 'openai',
      label: 'OpenAI',
      reason: openAiAvailable
        ? null
        : 'Add an OpenAI key in Settings to enable it.',
    },
    {
      available: geminiAvailable,
      id: 'gemini',
      label: 'Gemini',
      reason: geminiAvailable
        ? null
        : 'Add a Gemini key in Settings to enable it.',
    },
  ];
}

export function getEnabledProviderIds(
  providers: readonly ProviderAvailability[],
): ProviderId[] {
  return providers
    .filter((provider) => provider.available)
    .map((provider) => provider.id);
}
