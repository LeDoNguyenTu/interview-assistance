import { describe, expect, it } from 'vitest';

import type { SessionRecord } from './schema.js';
import { createFixtureWorkspace, reduceWorkspace } from './workspace.js';

const session: SessionRecord = {
  id: 'session-1',
  ownerId: 'owner-1',
  title: 'Product interview',
  mode: 'interviewer',
  status: 'draft',
  providerId: 'fixture',
  captureSources: [],
  consentedAt: null,
  startedAt: null,
  endedAt: null,
  createdAt: '2026-08-12T00:00:00.000Z',
  updatedAt: '2026-08-12T00:00:00.000Z',
};

describe('fixture workspace', () => {
  it('requires explicit consent before a visible fixture session can start', () => {
    const initial = createFixtureWorkspace(session);
    const blocked = reduceWorkspace(initial, { type: 'start-fixture' });
    const consented = reduceWorkspace(initial, { type: 'acknowledge-consent' });
    const started = reduceWorkspace(consented, { type: 'start-fixture' });

    expect(blocked).toEqual(initial);
    expect(started).toMatchObject({
      consentAcknowledged: true,
      state: 'capturing',
      transcript: expect.arrayContaining([
        expect.objectContaining({ speaker: 'Interviewer' }),
      ]),
    });
  });

  it('adds a note without changing immutable fixture transcript timestamps', () => {
    const initial = createFixtureWorkspace(session);
    const started = reduceWorkspace(
      reduceWorkspace(initial, { type: 'acknowledge-consent' }),
      { type: 'start-fixture' },
    );
    const noted = reduceWorkspace(started, {
      type: 'add-note',
      body: 'Probe the trade-off behind this answer.',
    });

    expect(noted.notes).toEqual(['Probe the trade-off behind this answer.']);
    expect(noted.transcript).toEqual(started.transcript);
  });
});
