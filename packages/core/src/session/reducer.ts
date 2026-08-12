import type { SessionEvent } from './events.js';
import type { SessionRecord, SessionStatus } from './schema.js';

export type SessionClock = () => string;

export class SessionTransitionError extends Error {
  readonly from: SessionStatus;
  readonly eventType: SessionEvent['type'];

  constructor(from: SessionStatus, eventType: SessionEvent['type']) {
    super(`Cannot apply ${eventType} while session status is ${from}`);
    this.name = 'SessionTransitionError';
    this.from = from;
    this.eventType = eventType;
  }
}

function reject(session: SessionRecord, event: SessionEvent): never {
  throw new SessionTransitionError(session.status, event.type);
}

function update(
  session: SessionRecord,
  clock: SessionClock,
  changes: (timestamp: string) => Partial<SessionRecord>,
): SessionRecord {
  const timestamp = clock();
  return { ...session, ...changes(timestamp), updatedAt: timestamp };
}

function authorizesCaptureSources(
  session: SessionRecord,
  event: Extract<SessionEvent, { type: 'CONFIRM_CONSENT' }>,
): boolean {
  return (
    event.consent.sessionId === session.id &&
    event.consent.ownerId === session.ownerId &&
    session.captureSources.every((source) =>
      event.consent.acceptedSources.includes(source),
    )
  );
}

export function reduceSession(
  session: SessionRecord,
  event: SessionEvent,
  clock: SessionClock,
): SessionRecord {
  switch (event.type) {
    case 'PREPARE':
      return session.status === 'draft'
        ? update(session, clock, () => ({ status: 'ready' }))
        : reject(session, event);
    case 'CONFIRM_CONSENT':
      return session.status === 'ready' &&
        session.consentedAt === null &&
        authorizesCaptureSources(session, event)
        ? update(session, clock, () => ({
            consentedAt: event.consent.acceptedAt,
          }))
        : reject(session, event);
    case 'START_CAPTURE':
      return session.status === 'ready' && session.consentedAt !== null
        ? update(session, clock, (timestamp) => ({
            status: 'capturing',
            startedAt: timestamp,
          }))
        : reject(session, event);
    case 'INTERRUPT':
      return session.status === 'capturing'
        ? update(session, clock, () => ({ status: 'interrupted' }))
        : reject(session, event);
    case 'RESUME':
      return session.status === 'interrupted'
        ? update(session, clock, () => ({ status: 'capturing' }))
        : reject(session, event);
    case 'STOP_CAPTURE':
      return session.status === 'capturing' || session.status === 'interrupted'
        ? update(session, clock, (timestamp) => ({
            status: 'processing',
            endedAt: timestamp,
          }))
        : reject(session, event);
    case 'COMPLETE_PROCESSING':
      return session.status === 'processing'
        ? update(session, clock, () => ({ status: 'completed' }))
        : reject(session, event);
    case 'FAIL':
      return session.status === 'processing'
        ? update(session, clock, () => ({ status: 'failed' }))
        : reject(session, event);
    case 'RESET':
      return session.status === 'completed' || session.status === 'failed'
        ? update(session, clock, () => ({
            status: 'draft',
            consentedAt: null,
            startedAt: null,
            endedAt: null,
          }))
        : reject(session, event);
  }
}
