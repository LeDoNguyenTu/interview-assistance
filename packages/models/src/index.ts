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
export {
  validateGuidanceRequest,
  validateQuestionDetectionInput,
  validateTranscriptSegments,
} from './contracts/invariants.js';
export type { InputInvariant } from './contracts/invariants.js';
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
