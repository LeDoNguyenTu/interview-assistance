import type { SessionRecord } from '@candorlens/core';
import { describe, expect, it } from 'vitest';

import {
  createLiveSessionState,
  reduceLiveSession,
} from './live-session-machine.js';

const session: SessionRecord = {
  captureSources: [],
  consentedAt: null,
  createdAt: '2026-08-13T00:00:00.000Z',
  endedAt: null,
  id: 'session-1',
  mode: 'coach',
  ownerId: 'owner-1',
  providerId: 'fixture',
  startedAt: null,
  status: 'draft',
  title: 'Product interview',
  updatedAt: '2026-08-13T00:00:00.000Z',
};

describe('live session state', () => {
  it('keeps capture gated until sources are prepared, then exposes fixture transcript after start', () => {
    let state = createLiveSessionState(session);
    state = reduceLiveSession(state, {
      sources: ['microphone'],
      type: 'sources-prepared',
    });
    state = reduceLiveSession(state, { type: 'capture-started' });

    expect(state).toMatchObject({
      activeSources: ['microphone'],
      status: 'capturing',
    });
    expect(state.transcript[0]).toMatchObject({
      speaker: 'Interviewer',
      text: 'Tell me about a challenging project.',
    });
  });

  it('adds notes without altering the live transcript and preserves an interrupted state', () => {
    let state = createLiveSessionState(session);
    state = reduceLiveSession(state, {
      sources: ['browser-tab'],
      type: 'sources-prepared',
    });
    state = reduceLiveSession(state, { type: 'capture-started' });
    state = reduceLiveSession(state, {
      body: 'Clarify impact.',
      type: 'add-note',
    });
    state = reduceLiveSession(state, { type: 'capture-interrupted' });

    expect(state).toMatchObject({
      notes: ['Clarify impact.'],
      status: 'interrupted',
    });
    expect(state.transcript).toHaveLength(1);
  });

  it('keeps parallel transcription results ordered by capture sequence', () => {
    let state = createLiveSessionState(session);
    const item = (sequence: number) => ({
      confidence: null,
      endMs: sequence * 3_000 + 3_000,
      id: `segment-${sequence}`,
      partial: false as const,
      sequence,
      speaker: 'Participant' as const,
      startMs: sequence * 3_000,
      text: `Segment ${sequence}`,
      timestamp: `00:0${sequence}`,
    });

    state = reduceLiveSession(state, {
      item: item(2),
      type: 'transcript-finalized',
    });
    state = reduceLiveSession(state, {
      item: item(1),
      type: 'transcript-finalized',
    });

    expect(state.transcript.map((entry) => entry.sequence)).toEqual([1, 2]);
  });
});
