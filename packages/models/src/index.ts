export { ProviderError, normalizeProviderError } from './contracts/errors.js';
export type {
  ProviderErrorCode,
  ProviderErrorDetails,
  ProviderOperation,
} from './contracts/errors.js';

export type {
  GuidanceProvider,
  GuidanceRequest,
  GuidanceResult,
} from './contracts/guidance.js';
export type {
  DetectedQuestion,
  QuestionDetector,
} from './contracts/questions.js';
export type {
  TranscriptSegment,
  TranscriptionConnectRequest,
  TranscriptionConnectionState,
  TranscriptionEvents,
  TranscriptionProvider,
  TranscriptionUsage,
} from './contracts/transcription.js';

export { FixtureProvider } from './fixture/fixture-provider.js';
export { runGuidanceProviderContract } from './contract-tests/guidance-contract.js';
export type { GuidanceProviderFactory } from './contract-tests/guidance-contract.js';
