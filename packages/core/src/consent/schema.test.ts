import { describe, expect, it } from 'vitest';

import { consentRecordSchema } from './schema.js';

describe('consentRecordSchema', () => {
  it('parses a versioned consent record with its accepted sources', () => {
    const consent = consentRecordSchema.parse({
      sessionId: 'session-1',
      ownerId: 'owner-1',
      consentVersion: '2026-08-12',
      acceptedSources: ['microphone', 'browser-tab'],
      acceptedAt: '2026-08-12T00:02:00.000Z',
      locale: 'en-SG',
    });

    expect(consent).toEqual({
      sessionId: 'session-1',
      ownerId: 'owner-1',
      consentVersion: '2026-08-12',
      acceptedSources: ['microphone', 'browser-tab'],
      acceptedAt: '2026-08-12T00:02:00.000Z',
      locale: 'en-SG',
    });
  });

  it('rejects consent records without an accepted capture source', () => {
    expect(() =>
      consentRecordSchema.parse({
        sessionId: 'session-1',
        ownerId: 'owner-1',
        consentVersion: '2026-08-12',
        acceptedSources: [],
        acceptedAt: '2026-08-12T00:02:00.000Z',
        locale: 'en-SG',
      }),
    ).toThrow();
  });

  it('rejects consent records with an invalid acceptance timestamp', () => {
    expect(() =>
      consentRecordSchema.parse({
        sessionId: 'session-1',
        ownerId: 'owner-1',
        consentVersion: '2026-08-12',
        acceptedSources: ['microphone'],
        acceptedAt: '12 August 2026',
        locale: 'en-SG',
      }),
    ).toThrow();
  });
});
