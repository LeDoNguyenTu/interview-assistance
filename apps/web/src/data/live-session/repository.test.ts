import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  hasSessionConsent,
  listLiveSessionSnapshot,
  saveDetectedQuestion,
  saveFinalUtterance,
  saveGuidanceEvent,
  saveSessionNote,
  saveSessionConsent,
  type LiveSessionSql,
} from './repository.js';

function createSql(rows: unknown[][]) {
  const calls: Array<{ text: string; values: unknown[] }> = [];
  const sql: LiveSessionSql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return (rows.shift() ?? []) as never;
  };
  return { calls, sql };
}

describe('live session repository', () => {
  it('persists a final utterance only through an owner-scoped session insert', async () => {
    const database = createSql([[{ id: 'utterance-1' }]]);

    await expect(
      saveFinalUtterance(database.sql, { sub: 'owner-1' }, 'session-1', {
        confidence: 0.98,
        endMs: 4000,
        id: 'utterance-1',
        sequence: 1,
        speaker: 'interviewer',
        startMs: 1000,
        text: 'What outcome did you measure?',
      }),
    ).resolves.toBe(true);

    expect(database.calls[0]?.text).toContain(
      'from public.sessions where id = ? and user_id = ?',
    );
    expect(database.calls[0]?.text).toContain(
      'on conflict (session_id, sequence)',
    );
    expect(database.calls[0]?.values).toContain('owner-1');
  });

  it('returns false when the session is not owned by the authenticated user', async () => {
    const database = createSql([[]]);

    await expect(
      saveSessionNote(database.sql, { sub: 'owner-2' }, 'session-1', {
        body: 'Private reviewer context.',
        idempotencyKey: 'note-1',
      }),
    ).resolves.toBe(false);
  });

  it('stores generated guidance under a session-scoped idempotency key', async () => {
    const database = createSql([[{ id: 'guidance-1' }]]);

    await expect(
      saveGuidanceEvent(database.sql, { sub: 'owner-1' }, 'session-1', {
        idempotencyKey: 'request-1',
        provider: 'openai',
        text: 'Ask for one measurable result.',
      }),
    ).resolves.toBe(true);

    expect(database.calls[0]?.text).toContain(
      'on conflict (session_id, idempotency_key)',
    );
    expect(database.calls[0]?.values).toEqual([
      'owner-1',
      'request-1',
      'openai',
      'Ask for one measurable result.',
      'session-1',
      'owner-1',
    ]);
  });

  it('stores a detected question only for an utterance owned by the session owner', async () => {
    const database = createSql([[{ id: 'question-utterance-1' }]]);

    await expect(
      saveDetectedQuestion(database.sql, { sub: 'owner-1' }, 'session-1', {
        confidence: 0.91,
        sourceUtteranceId: 'utterance-1',
        text: 'What result did you measure?',
      }),
    ).resolves.toBe(true);

    expect(database.calls[0]?.text).toContain('join public.utterances');
    expect(database.calls[0]?.text).toContain(
      'on conflict (session_id, source_utterance_id)',
    );
    expect(database.calls[0]?.values).toContain('owner-1');
  });

  it('loads owner-scoped transcript and notes in stable display order', async () => {
    const database = createSql([
      [
        {
          confidence: 0.88,
          end_ms: 9200,
          id: 'utterance-2',
          sequence: 2,
          speaker: 'interviewer',
          start_ms: 6100,
          text: 'What changed after launch?',
        },
      ],
      [{ body: 'Follow up on adoption.', idempotency_key: 'note-1' }],
      [
        {
          provider: 'openai',
          result_text: 'Ask for one measurable result.',
        },
      ],
    ]);

    await expect(
      listLiveSessionSnapshot(
        database.sql,
        { sub: 'owner-1' },
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ),
    ).resolves.toEqual({
      notes: ['Follow up on adoption.'],
      guidance: {
        provider: 'openai',
        text: 'Ask for one measurable result.',
      },
      transcript: [
        {
          confidence: 0.88,
          endMs: 9200,
          id: 'utterance-2',
          partial: false,
          sequence: 2,
          speaker: 'Interviewer',
          startMs: 6100,
          text: 'What changed after launch?',
          timestamp: '00:06',
        },
      ],
    });
    expect(database.calls[0]?.text).toContain('user_id = ?');
    expect(database.calls[1]?.text).toContain('user_id = ?');
    expect(database.calls[2]?.text).toContain('user_id = ?');
  });

  it('records versioned consent and selected sources for an owned session', async () => {
    const database = createSql([[{ id: 'session-1' }]]);

    await expect(
      saveSessionConsent(database.sql, { sub: 'owner-1' }, 'session-1', [
        'microphone',
        'browser-tab',
      ]),
    ).resolves.toBe(true);

    expect(database.calls[0]?.text).toContain('consent_version = ?');
    expect(database.calls[0]?.text).toContain('consented_at = now()');
    expect(database.calls[0]?.values).toContain('capture-consent-v1');
  });

  it('checks durable consent before accepting captured events', async () => {
    const database = createSql([[{ id: 'session-1' }]]);

    await expect(
      hasSessionConsent(database.sql, { sub: 'owner-1' }, 'session-1'),
    ).resolves.toBe(true);
    expect(database.calls[0]?.text).toContain('consented_at is not null');
    expect(database.calls[0]?.text).toContain(
      'cardinality(capture_sources) > 0',
    );
  });
});
