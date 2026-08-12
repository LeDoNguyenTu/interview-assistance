import type { Database, SessionRecord } from '@candorlens/core';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type DatabaseError = { message: string } | null;
type QueryResult<T> = PromiseLike<{ data: T; error: DatabaseError }>;

type SessionQuery = {
  eq(column: keyof SessionRow, value: string): SessionQuery;
  maybeSingle(): QueryResult<SessionRow | null>;
  order(
    column: keyof SessionRow,
    options: { ascending: boolean },
  ): QueryResult<SessionRow[] | null>;
};

export interface SessionDatabaseClient {
  from(table: 'sessions'): {
    insert(values: SessionInsert): {
      select(): { single(): QueryResult<SessionRow | null> };
    };
    select(columns?: string): SessionQuery;
  };
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
    mode: SessionInsert['mode'];
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

function databaseFailure(error: DatabaseError): never {
  throw new Error(error?.message ?? 'The session data could not be loaded.');
}

export async function createDraftSession(
  database: SessionDatabaseClient,
  owner: ValidatedOwner,
  input: unknown,
): Promise<SessionRecord> {
  const result = parseDraftSessionInput(input);

  const { data, error } = await database
    .from('sessions')
    .insert({
      capture_sources: [],
      mode: result.mode,
      platform: 'web',
      provider: 'fixture',
      recording_enabled: false,
      status: 'draft',
      title: result.title,
      user_id: owner.sub,
    })
    .select()
    .single();

  if (error || !data) {
    return databaseFailure(error);
  }

  return mapSession(data);
}

export async function listSessionsForOwner(
  database: SessionDatabaseClient,
  owner: ValidatedOwner,
): Promise<SessionRecord[]> {
  const { data, error } = await database
    .from('sessions')
    .select('*')
    .eq('user_id', owner.sub)
    .order('created_at', { ascending: false });

  if (error) {
    return databaseFailure(error);
  }

  return (data ?? []).map(mapSession);
}

export async function getSessionForOwner(
  database: SessionDatabaseClient,
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

  const { data, error } = await database
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', owner.sub)
    .maybeSingle();

  if (error) {
    return databaseFailure(error);
  }

  return data ? mapSession(data) : null;
}
