import type { Database, SessionRecord } from '@candorlens/core';
import type { NeonSql } from '../../lib/neon/database';

type SessionRow = Database['public']['Tables']['sessions']['Row'];

export type SessionSql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<SessionRow[]>;

export function asSessionSql(sql: NeonSql): SessionSql {
  const sessionSql = sql as unknown as SessionSql;
  return (strings, ...values) => sessionSql(strings, ...values);
}

type ValidatedOwner = { sub: string };
const sessionModes = ['coach', 'interviewer', 'defense'] as const;
const sessionStatuses = [
  'draft',
  'ready',
  'capturing',
  'interrupted',
  'processing',
  'completed',
  'failed',
] as const;
const providerIds = ['gemini', 'openai', 'fixture'] as const;

export class SessionInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionInputError';
  }
}

function parseDraftSessionInput(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw new SessionInputError('Enter valid session details.');
  }

  const candidate = input as {
    mode?: unknown;
    providerId?: unknown;
    title?: unknown;
  };
  const title =
    typeof candidate.title === 'string' ? candidate.title.trim() : '';
  if (!title) {
    throw new SessionInputError('Enter a session title.');
  }
  if (title.length > 160) {
    throw new SessionInputError('Keep the title under 160 characters.');
  }
  if (!sessionModes.includes(candidate.mode as (typeof sessionModes)[number])) {
    throw new SessionInputError('Choose a valid interview mode.');
  }
  if (candidate.providerId !== 'fixture') {
    throw new SessionInputError('Draft sessions use the fixture provider.');
  }

  return { mode: candidate.mode, title } as {
    mode: SessionRow['mode'];
    title: string;
  };
}

function mapSession(row: SessionRow): SessionRecord {
  if (
    !sessionModes.includes(row.mode as (typeof sessionModes)[number]) ||
    !sessionStatuses.includes(row.status as (typeof sessionStatuses)[number]) ||
    !providerIds.includes(row.provider as (typeof providerIds)[number])
  ) {
    throw new Error('The session data could not be loaded.');
  }

  return {
    captureSources: row.capture_sources as SessionRecord['captureSources'],
    consentedAt: row.consented_at,
    createdAt: row.created_at,
    endedAt: row.ended_at,
    id: row.id,
    mode: row.mode as SessionRecord['mode'],
    ownerId: row.user_id,
    providerId: row.provider as SessionRecord['providerId'],
    startedAt: row.started_at,
    status: row.status as SessionRecord['status'],
    title: row.title,
    updatedAt: row.updated_at,
  };
}

export async function createDraftSession(
  sql: SessionSql,
  owner: ValidatedOwner,
  input: unknown,
): Promise<SessionRecord> {
  const result = parseDraftSessionInput(input);

  const [row] = await sql`
    insert into public.sessions (
      user_id,
      mode,
      platform,
      provider,
      status,
      capture_sources,
      recording_enabled,
      title
    )
    values (
      ${owner.sub},
      ${result.mode},
      ${'web'},
      ${'fixture'},
      ${'draft'},
      ${[]},
      ${false},
      ${result.title}
    )
    returning *
  `;

  if (!row) {
    throw new Error('The session data could not be loaded.');
  }

  return mapSession(row);
}

export async function listSessionsForOwner(
  sql: SessionSql,
  owner: ValidatedOwner,
): Promise<SessionRecord[]> {
  const rows = await sql`
    select *
    from public.sessions
    where user_id = ${owner.sub}
    order by created_at desc
  `;

  return rows.map(mapSession);
}

export async function getSessionForOwner(
  sql: SessionSql,
  owner: ValidatedOwner,
  sessionId: string,
): Promise<SessionRecord | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  ) {
    return null;
  }

  const [row] = await sql`
    select *
    from public.sessions
    where id = ${sessionId} and user_id = ${owner.sub}
    limit 1
  `;

  return row ? mapSession(row) : null;
}
