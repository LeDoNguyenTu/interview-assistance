import type { ProviderId } from '@candorlens/core';

export type ProviderErrorCode =
  | 'cancelled'
  | 'invalid_request'
  | 'invalid_response'
  | 'rate_limited'
  | 'refused'
  | 'timeout'
  | 'unavailable';

export type ProviderOperation =
  | 'connect'
  | 'sendAudio'
  | 'finish'
  | 'close'
  | 'detectQuestions'
  | 'generateGuidance';

export interface ProviderErrorDetails {
  code: ProviderErrorCode;
  providerId: ProviderId;
  retryable: boolean;
  operation: ProviderOperation;
}

const safeMessages: Record<ProviderErrorCode, string> = {
  cancelled: 'The operation was cancelled.',
  invalid_request: 'The request could not be processed.',
  invalid_response: 'The provider returned an unusable response.',
  rate_limited: 'The provider is temporarily rate limited.',
  refused: 'The provider could not complete this request.',
  timeout: 'The provider took too long to respond.',
  unavailable: 'The provider is temporarily unavailable.',
};

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly providerId: ProviderId;
  readonly retryable: boolean;
  readonly operation: ProviderOperation;

  constructor(details: ProviderErrorDetails) {
    super(safeMessages[details.code]);
    this.name = 'ProviderError';
    this.code = details.code;
    this.providerId = details.providerId;
    this.retryable = details.retryable;
    this.operation = details.operation;
  }
}

export function normalizeProviderError(
  details: ProviderErrorDetails,
): ProviderError {
  return new ProviderError(details);
}
