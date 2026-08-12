import { describe, expect, it } from 'vitest';

import { mapSessionRow } from './mappers.js';

describe('mapSessionRow', () => {
  it('maps a database session row without losing cleared nullable fields', () => {
    const result = mapSessionRow({
      id: 'session-1',
      user_id: 'owner-1',
      interview_profile_id: null,
      title: 'Practice interview',
      mode: 'coach',
      status: 'draft',
      provider: 'fixture',
      platform: 'web',
      capture_sources: ['microphone'],
      recording_enabled: false,
      consent_version: null,
      consented_at: null,
      started_at: null,
      ended_at: null,
      created_at: '2026-08-12T00:00:00.000Z',
      updated_at: '2026-08-12T00:01:00.000Z',
    });

    expect(result).toEqual({
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
      createdAt: '2026-08-12T00:00:00.000Z',
      updatedAt: '2026-08-12T00:01:00.000Z',
    });
  });

  it('rejects invalid stored enums instead of returning a malformed domain record', () => {
    expect(() =>
      mapSessionRow({
        id: 'session-1',
        user_id: 'owner-1',
        interview_profile_id: null,
        title: 'Practice interview',
        mode: 'not-a-mode',
        status: 'draft',
        provider: 'fixture',
        platform: 'web',
        capture_sources: ['microphone'],
        recording_enabled: false,
        consent_version: '2026-08-12',
        consented_at: '2026-08-12T00:00:00.000Z',
        started_at: null,
        ended_at: null,
        created_at: '2026-08-12T00:00:00.000Z',
        updated_at: '2026-08-12T00:00:00.000Z',
      }),
    ).toThrow(/mode/i);
  });
});
