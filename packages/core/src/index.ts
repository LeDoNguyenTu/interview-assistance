export { consentRecordSchema } from './consent/schema.js';
export type { ConsentRecord } from './consent/schema.js';

export { sessionEventSchema } from './session/events.js';
export type { SessionEvent } from './session/events.js';

export { reduceSession, SessionTransitionError } from './session/reducer.js';
export type { SessionClock } from './session/reducer.js';

export {
  captureSourceSchema,
  providerIdSchema,
  sessionModeSchema,
  sessionRecordSchema,
  sessionStatusSchema,
} from './session/schema.js';
export type { CaptureSource, ProviderId, SessionMode, SessionRecord, SessionStatus } from './session/schema.js';
