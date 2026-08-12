import type { Database } from '@candorlens/core';
import { describe, expect, it } from 'vitest';

import {
  SessionInputError,
  createDraftSession,
  getSessionForOwner,
  listSessionsForOwner,
  type SessionDatabaseClient,
} from './repository.js';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];

const owner = { sub: '11111111-1111-1111-1111-111111111111' };
const secondOwner = { sub: '22222222-2222-2222-2222-222222222222' };

function sessionRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    capture_sources: [],
    consented_at: null,
    consent_version: null,
    created_at: '2026-08-12T10:00:00.000Z',
    ended_at: null,
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    interview_profile_id: null,
    mode: 'coach',
    platform: 'web',
    provider: 'fixture',
    recording_enabled: false,
    started_at: null,
    status: 'draft',
    title: 'Practice introduction',
    updated_at: '2026-08-12T10:00:00.000Z',
    user_id: owner.sub,
    ...overrides,
  };
}

class MemorySessionDatabase {
  readonly rows: SessionRow[];
  private sequence = 0;

  constructor(rows: SessionRow[] = []) {
    this.rows = [...rows];
  }

  readonly client: SessionDatabaseClient = {
    from: () => ({
      insert: (values) => ({
        select: () => ({
          single: async () => {
            const row = this.insert(values);
            return { data: row, error: null };
          },
        }),
      }),
      select: () => this.query(),
    }),
  };

  private insert(values: SessionInsert): SessionRow {
    this.sequence += 1;
    const now = `2026-08-12T10:00:0${this.sequence}.000Z`;
    const row = sessionRow({
      ...values,
      created_at: now,
      id: `00000000-0000-4000-8000-00000000000${this.sequence}`,
      updated_at: now,
    });
    this.rows.push(row);
    return row;
  }

  private query() {
    const conditions: Array<[keyof SessionRow, string]> = [];
    const query = {
      eq: (column: keyof SessionRow, value: string) => {
        conditions.push([column, value]);
        return query;
      },
      maybeSingle: async () => ({
        data: this.match(conditions)[0] ?? null,
        error: null,
      }),
      order: async (
        column: keyof SessionRow,
        options: { ascending: boolean },
      ) => ({
        data: this.match(conditions).sort((left, right) => {
          const comparison = String(left[column]).localeCompare(
            String(right[column]),
          );
          return options.ascending ? comparison : -comparison;
        }),
        error: null,
      }),
    };
    return query;
  }

  private match(conditions: Array<[keyof SessionRow, string]>) {
    return this.rows.filter((row) =>
      conditions.every(([column, value]) => row[column] === value),
    );
  }
}

describe('session repository', () => {
  it('creates only a fixture-backed draft without consent or a capture start', async () => {
    const database = new MemorySessionDatabase();

    const created = await createDraftSession(database.client, owner, {
      mode: 'interviewer',
      providerId: 'fixture',
      title: '  Architecture interview  ',
    });

    expect(created).toMatchObject({
      captureSources: [],
      consentedAt: null,
      mode: 'interviewer',
      providerId: 'fixture',
      startedAt: null,
      status: 'draft',
      title: 'Architecture interview',
    });
    expect(database.rows[0]).toMatchObject({
      capture_sources: [],
      consented_at: null,
      provider: 'fixture',
      recording_enabled: false,
      started_at: null,
      status: 'draft',
      user_id: owner.sub,
    });
  });

  it('lists only the validated owner sessions with the newest first', async () => {
    const database = new MemorySessionDatabase([
      sessionRow({
        created_at: '2026-08-12T09:00:00.000Z',
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        title: 'Older',
      }),
      sessionRow({
        created_at: '2026-08-12T11:00:00.000Z',
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: 'Newest',
      }),
      sessionRow({
        created_at: '2026-08-12T12:00:00.000Z',
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        title: 'Other owner',
        user_id: secondOwner.sub,
      }),
    ]);

    const sessions = await listSessionsForOwner(database.client, owner);

    expect(sessions.map((session) => session.title)).toEqual([
      'Newest',
      'Older',
    ]);
  });

  it('loads an owner session by its ID', async () => {
    const database = new MemorySessionDatabase([sessionRow()]);

    const session = await getSessionForOwner(
      database.client,
      owner,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );

    expect(session).toMatchObject({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ownerId: owner.sub,
    });
  });

  it('returns not found instead of leaking a session owned by another user', async () => {
    const database = new MemorySessionDatabase([sessionRow()]);

    await expect(
      getSessionForOwner(
        database.client,
        secondOwner,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ),
    ).resolves.toBeNull();
  });

  it('rejects malformed draft input before a database write', async () => {
    const database = new MemorySessionDatabase();

    await expect(
      createDraftSession(database.client, owner, {
        mode: 'coach',
        providerId: 'openai',
        title: ' ',
      }),
    ).rejects.toBeInstanceOf(SessionInputError);
    expect(database.rows).toHaveLength(0);
  });

  it('returns not found for an invalid or missing session ID', async () => {
    const database = new MemorySessionDatabase();

    await expect(
      getSessionForOwner(database.client, owner, 'not-a-session-id'),
    ).resolves.toBeNull();
    await expect(
      getSessionForOwner(
        database.client,
        owner,
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
      ),
    ).resolves.toBeNull();
  });
});
