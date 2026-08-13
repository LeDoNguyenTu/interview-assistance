import 'server-only';

import type { ProviderId } from '@candorlens/core';

import type { ProviderAvailability } from './provider-types.js';

type ProviderEnvironment = Readonly<Record<string, string | undefined>>;

function configured(...values: Array<string | undefined>): boolean {
  return values.every((value) => value?.trim());
}

export function getProviderAvailability(
  environment: ProviderEnvironment,
): ProviderAvailability[] {
  return [
    {
      available: true,
      id: 'fixture',
      label: 'Fixture preview',
      reason: null,
    },
    {
      available: configured(
        environment.OPENAI_API_KEY,
        environment.OPENAI_TEXT_MODEL,
      ),
      id: 'openai',
      label: 'OpenAI',
      reason: configured(
        environment.OPENAI_API_KEY,
        environment.OPENAI_TEXT_MODEL,
      )
        ? null
        : 'Configure a server-side OpenAI provider to enable it.',
    },
    {
      available: configured(
        environment.GEMINI_API_KEY,
        environment.GEMINI_TEXT_MODEL,
      ),
      id: 'gemini',
      label: 'Gemini',
      reason: configured(
        environment.GEMINI_API_KEY,
        environment.GEMINI_TEXT_MODEL,
      )
        ? null
        : 'Configure a server-side Gemini provider to enable it.',
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
