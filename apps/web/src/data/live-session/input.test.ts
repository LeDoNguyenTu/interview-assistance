import { describe, expect, it } from 'vitest';

import { LiveSessionEventInputError, parseLiveSessionEvent } from './input.js';

describe('parseLiveSessionEvent', () => {
  it('accepts a bounded final transcript event', () => {
    expect(
      parseLiveSessionEvent({
        confidence: 0.92,
        endMs: 4200,
        id: 'segment-1',
        sequence: 1,
        speaker: 'interviewer',
        startMs: 1200,
        text: 'What did you learn?',
        type: 'utterance',
      }),
    ).toEqual({
      confidence: 0.92,
      endMs: 4200,
      id: 'segment-1',
      sequence: 1,
      speaker: 'interviewer',
      startMs: 1200,
      text: 'What did you learn?',
      type: 'utterance',
    });
  });

  it('accepts a versioned consent event with visible browser sources', () => {
    expect(
      parseLiveSessionEvent({
        sources: ['microphone', 'browser-tab'],
        type: 'consent',
      }),
    ).toEqual({
      sources: ['microphone', 'browser-tab'],
      type: 'consent',
    });
  });

  it('rejects partial, empty, oversized, and structurally invalid events', () => {
    for (const input of [
      { body: '', idempotencyKey: 'note-1', type: 'note' },
      { body: 'x'.repeat(4001), idempotencyKey: 'note-1', type: 'note' },
      { id: 'segment-1', sequence: -1, type: 'utterance' },
      { type: 'unknown' },
    ]) {
      expect(() => parseLiveSessionEvent(input)).toThrow(
        LiveSessionEventInputError,
      );
    }
  });
});
