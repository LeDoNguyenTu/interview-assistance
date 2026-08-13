import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  asLiveSessionSql: vi.fn((sql) => sql),
  getNeonSql: vi.fn(() => 'neon-sql'),
  hasSessionConsent: vi.fn().mockResolvedValue(true),
  saveDetectedQuestion: vi.fn().mockResolvedValue(true),
  saveFinalUtterance: vi.fn().mockResolvedValue(true),
  saveSessionNote: vi.fn().mockResolvedValue(true),
  saveSessionConsent: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../../../lib/auth/neon-auth.js', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../../../lib/neon/database.js', () => ({
  getNeonSql: dependencies.getNeonSql,
}));
vi.mock('../../../../../data/live-session/repository.js', () => ({
  asLiveSessionSql: dependencies.asLiveSessionSql,
  hasSessionConsent: dependencies.hasSessionConsent,
  saveDetectedQuestion: dependencies.saveDetectedQuestion,
  saveFinalUtterance: dependencies.saveFinalUtterance,
  saveSessionNote: dependencies.saveSessionNote,
  saveSessionConsent: dependencies.saveSessionConsent,
}));

import { getAuthenticatedUser } from '../../../../../lib/auth/neon-auth';
import { POST } from './route';

const context = {
  params: Promise.resolve({
    sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  }),
};

afterEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuthenticatedUser).mockResolvedValue({ sub: 'owner-1' });
  dependencies.saveDetectedQuestion.mockResolvedValue(true);
  dependencies.saveFinalUtterance.mockResolvedValue(true);
  dependencies.saveSessionNote.mockResolvedValue(true);
  dependencies.saveSessionConsent.mockResolvedValue(true);
  dependencies.hasSessionConsent.mockResolvedValue(true);
});

describe('POST /api/sessions/[sessionId]/events', () => {
  it('rejects unauthenticated event writes', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);

    const response = await POST(
      new Request('https://candorlens.test/api/sessions/session-1/events', {
        body: JSON.stringify({
          body: 'Private note',
          idempotencyKey: 'note-1',
          type: 'note',
        }),
        method: 'POST',
      }),
      context,
    );

    expect(response.status).toBe(401);
    expect(dependencies.saveSessionNote).not.toHaveBeenCalled();
  });

  it('validates bounded event input before touching Neon', async () => {
    const response = await POST(
      new Request('https://candorlens.test/api/sessions/session-1/events', {
        body: JSON.stringify({ type: 'unknown' }),
        method: 'POST',
      }),
      context,
    );

    expect(response.status).toBe(400);
    expect(dependencies.getNeonSql).not.toHaveBeenCalled();
  });

  it('stores an owner-scoped note with no-store semantics', async () => {
    const response = await POST(
      new Request('https://candorlens.test/api/sessions/session-1/events', {
        body: JSON.stringify({
          body: 'Private note',
          idempotencyKey: 'note-1',
          type: 'note',
        }),
        method: 'POST',
      }),
      context,
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(dependencies.saveSessionNote).toHaveBeenCalledWith(
      'neon-sql',
      { sub: 'owner-1' },
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      { body: 'Private note', idempotencyKey: 'note-1' },
    );
  });

  it('rejects captured events until consent is durably recorded', async () => {
    dependencies.hasSessionConsent.mockResolvedValueOnce(false);
    const response = await POST(
      new Request('https://candorlens.test/api/sessions/session-1/events', {
        body: JSON.stringify({
          body: 'Private note',
          idempotencyKey: 'note-1',
          type: 'note',
        }),
        method: 'POST',
      }),
      context,
    );
    expect(response.status).toBe(409);
    expect(dependencies.saveSessionNote).not.toHaveBeenCalled();
  });

  it('records selected sources after consent and before capture', async () => {
    const response = await POST(
      new Request('https://candorlens.test/api/sessions/session-1/events', {
        body: JSON.stringify({
          sources: ['microphone', 'browser-tab'],
          type: 'consent',
        }),
        method: 'POST',
      }),
      context,
    );

    expect(response.status).toBe(201);
    expect(dependencies.saveSessionConsent).toHaveBeenCalledWith(
      'neon-sql',
      { sub: 'owner-1' },
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ['microphone', 'browser-tab'],
    );
  });

  it('stores a final interviewer utterance and its detected question', async () => {
    const event = {
      confidence: 0.92,
      endMs: 4200,
      id: 'segment-1',
      sequence: 1,
      speaker: 'interviewer',
      startMs: 1200,
      text: 'What did you learn?',
      type: 'utterance',
    };
    const response = await POST(
      new Request('https://candorlens.test/api/sessions/session-1/events', {
        body: JSON.stringify(event),
        method: 'POST',
      }),
      context,
    );

    expect(response.status).toBe(201);
    expect(dependencies.saveFinalUtterance).toHaveBeenCalledWith(
      'neon-sql',
      { sub: 'owner-1' },
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      expect.objectContaining({ id: 'segment-1', sequence: 1 }),
    );
    expect(dependencies.saveDetectedQuestion).toHaveBeenCalledWith(
      'neon-sql',
      { sub: 'owner-1' },
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      {
        confidence: 0.92,
        sourceUtteranceId: 'segment-1',
        text: 'What did you learn?',
      },
    );
  });

  it('returns not found when the user does not own the session', async () => {
    dependencies.saveSessionNote.mockResolvedValueOnce(false);

    const response = await POST(
      new Request('https://candorlens.test/api/sessions/session-1/events', {
        body: JSON.stringify({
          body: 'Private note',
          idempotencyKey: 'note-1',
          type: 'note',
        }),
        method: 'POST',
      }),
      context,
    );

    expect(response.status).toBe(404);
  });
});
