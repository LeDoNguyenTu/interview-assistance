import { describe, expect, it } from 'vitest';

import type { ConsentRecord } from '../consent/schema.js';
import type { SessionRecord } from './schema.js';
import { reduceSession, SessionTransitionError } from './reducer.js';

const createdAt = '2026-08-12T00:00:00.000Z';

function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'session-1',
    ownerId: 'owner-1',
    title: 'Practice interview',
    mode: 'coach',
    status: 'draft',
    providerId: 'fixture',
    captureSources: ['microphone'],
    consentedAt: null,
    startedAt: null,
    endedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function clock(...timestamps: string[]): () => string {
  let index = 0;
  return () => timestamps[index++] ?? timestamps.at(-1) ?? createdAt;
}

function consent(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    sessionId: 'session-1',
    ownerId: 'owner-1',
    consentVersion: '2026-08-12',
    acceptedSources: ['microphone'],
    acceptedAt: '2026-08-12T00:02:00.000Z',
    locale: 'en-SG',
    ...overrides,
  };
}

function transitionError(action: () => void): SessionTransitionError {
  try {
    action();
  } catch (error) {
    if (error instanceof SessionTransitionError) {
      return error;
    }

    throw error;
  }

  throw new Error('Expected a SessionTransitionError');
}

describe('reduceSession', () => {
  it('moves a prepared, consented session through capture and processing completion', () => {
    const now = clock(
      '2026-08-12T00:01:00.000Z',
      '2026-08-12T00:02:00.000Z',
      '2026-08-12T00:03:00.000Z',
      '2026-08-12T00:04:00.000Z',
      '2026-08-12T00:05:00.000Z',
    );

    const prepared = reduceSession(session(), { type: 'PREPARE' }, now);
    const consented = reduceSession(
      prepared,
      { type: 'CONFIRM_CONSENT', consent: consent() },
      now,
    );
    const capturing = reduceSession(consented, { type: 'START_CAPTURE' }, now);
    const processing = reduceSession(capturing, { type: 'STOP_CAPTURE' }, now);
    const completed = reduceSession(
      processing,
      { type: 'COMPLETE_PROCESSING' },
      now,
    );

    expect(prepared).toMatchObject({
      status: 'ready',
      updatedAt: '2026-08-12T00:01:00.000Z',
    });
    expect(consented).toMatchObject({
      status: 'ready',
      consentedAt: '2026-08-12T00:02:00.000Z',
      updatedAt: '2026-08-12T00:02:00.000Z',
    });
    expect(capturing).toMatchObject({
      status: 'capturing',
      startedAt: '2026-08-12T00:03:00.000Z',
      updatedAt: '2026-08-12T00:03:00.000Z',
    });
    expect(processing).toMatchObject({
      status: 'processing',
      endedAt: '2026-08-12T00:04:00.000Z',
      updatedAt: '2026-08-12T00:04:00.000Z',
    });
    expect(completed).toMatchObject({
      status: 'completed',
      updatedAt: '2026-08-12T00:05:00.000Z',
    });
  });

  it('rejects capture without recorded consent', () => {
    const ready = session({
      status: 'ready',
      updatedAt: '2026-08-12T00:01:00.000Z',
    });

    const error = transitionError(() =>
      reduceSession(
        ready,
        { type: 'START_CAPTURE' },
        clock('2026-08-12T00:02:00.000Z'),
      ),
    );

    expect(error).toMatchObject({
      from: 'ready',
      eventType: 'START_CAPTURE',
    });
  });

  it('rejects consent authorized for a different session', () => {
    const ready = session({ status: 'ready' });

    const error = transitionError(() =>
      reduceSession(
        ready,
        {
          type: 'CONFIRM_CONSENT',
          consent: consent({ sessionId: 'session-2' }),
        },
        clock('2026-08-12T00:02:00.000Z'),
      ),
    );

    expect(error).toMatchObject({
      from: 'ready',
      eventType: 'CONFIRM_CONSENT',
    });
  });

  it('rejects consent authorized for a different owner', () => {
    const ready = session({ status: 'ready' });

    const error = transitionError(() =>
      reduceSession(
        ready,
        { type: 'CONFIRM_CONSENT', consent: consent({ ownerId: 'owner-2' }) },
        clock('2026-08-12T00:02:00.000Z'),
      ),
    );

    expect(error).toMatchObject({
      from: 'ready',
      eventType: 'CONFIRM_CONSENT',
    });
  });

  it('rejects consent that does not cover every configured capture source', () => {
    const ready = session({
      status: 'ready',
      captureSources: ['microphone', 'system-audio'],
    });

    const error = transitionError(() =>
      reduceSession(
        ready,
        {
          type: 'CONFIRM_CONSENT',
          consent: consent({ acceptedSources: ['microphone'] }),
        },
        clock('2026-08-12T00:02:00.000Z'),
      ),
    );

    expect(error).toMatchObject({
      from: 'ready',
      eventType: 'CONFIRM_CONSENT',
    });
    expect(
      transitionError(() =>
        reduceSession(
          ready,
          { type: 'START_CAPTURE' },
          clock('2026-08-12T00:03:00.000Z'),
        ),
      ),
    ).toMatchObject({ from: 'ready', eventType: 'START_CAPTURE' });
  });

  it('rejects starting a capture that is already running', () => {
    const capturing = session({
      status: 'capturing',
      consentedAt: '2026-08-12T00:01:00.000Z',
      startedAt: '2026-08-12T00:02:00.000Z',
      updatedAt: '2026-08-12T00:02:00.000Z',
    });

    const error = transitionError(() =>
      reduceSession(
        capturing,
        { type: 'START_CAPTURE' },
        clock('2026-08-12T00:03:00.000Z'),
      ),
    );

    expect(error).toMatchObject({
      from: 'capturing',
      eventType: 'START_CAPTURE',
    });
  });

  it('interrupts and resumes an active capture with deterministic timestamps', () => {
    const active = session({
      status: 'capturing',
      consentedAt: '2026-08-12T00:01:00.000Z',
      startedAt: '2026-08-12T00:02:00.000Z',
      updatedAt: '2026-08-12T00:02:00.000Z',
    });
    const now = clock('2026-08-12T00:03:00.000Z', '2026-08-12T00:04:00.000Z');

    const interrupted = reduceSession(active, { type: 'INTERRUPT' }, now);
    const resumed = reduceSession(interrupted, { type: 'RESUME' }, now);

    expect(interrupted).toMatchObject({
      status: 'interrupted',
      updatedAt: '2026-08-12T00:03:00.000Z',
    });
    expect(resumed).toMatchObject({
      status: 'capturing',
      startedAt: '2026-08-12T00:02:00.000Z',
      updatedAt: '2026-08-12T00:04:00.000Z',
    });
  });

  it('stops an interrupted capture and records its end timestamp', () => {
    const interrupted = session({
      status: 'interrupted',
      consentedAt: '2026-08-12T00:01:00.000Z',
      startedAt: '2026-08-12T00:02:00.000Z',
      updatedAt: '2026-08-12T00:03:00.000Z',
    });

    const processing = reduceSession(
      interrupted,
      { type: 'STOP_CAPTURE' },
      clock('2026-08-12T00:04:00.000Z'),
    );

    expect(processing).toMatchObject({
      status: 'processing',
      endedAt: '2026-08-12T00:04:00.000Z',
      updatedAt: '2026-08-12T00:04:00.000Z',
    });
  });

  it('marks processing as failed when its provider fails', () => {
    const processing = session({
      status: 'processing',
      consentedAt: '2026-08-12T00:01:00.000Z',
      startedAt: '2026-08-12T00:02:00.000Z',
      endedAt: '2026-08-12T00:03:00.000Z',
      updatedAt: '2026-08-12T00:03:00.000Z',
    });

    const failed = reduceSession(
      processing,
      { type: 'FAIL' },
      clock('2026-08-12T00:04:00.000Z'),
    );

    expect(failed).toMatchObject({
      status: 'failed',
      updatedAt: '2026-08-12T00:04:00.000Z',
    });
  });

  it('resets a failed session to a new draft while preserving its identity', () => {
    const failed = session({
      status: 'failed',
      consentedAt: '2026-08-12T00:01:00.000Z',
      startedAt: '2026-08-12T00:02:00.000Z',
      endedAt: '2026-08-12T00:03:00.000Z',
      updatedAt: '2026-08-12T00:04:00.000Z',
    });

    const reset = reduceSession(
      failed,
      { type: 'RESET' },
      clock('2026-08-12T00:05:00.000Z'),
    );

    expect(reset).toMatchObject({
      id: 'session-1',
      ownerId: 'owner-1',
      status: 'draft',
      consentedAt: null,
      startedAt: null,
      endedAt: null,
      createdAt,
      updatedAt: '2026-08-12T00:05:00.000Z',
    });
  });
});
