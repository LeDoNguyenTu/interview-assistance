import type { ProviderId } from '@candorlens/core';

export type ProviderAvailability = {
  id: ProviderId;
  label: string;
  available: boolean;
  reason: string | null;
};
