import 'server-only';

import type { NeonSql } from '../../lib/neon/database';
import type { ConfigurableProvider } from '../provider-credentials/input';

type Owner = { sub: string };
type ResultRow = Record<string, unknown>;

export type LiveSessionSql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<ResultRow[]>;

export function asLiveSessionSql(sql: NeonSql): LiveSessionSql {
  const liveSql = sql as unknown as LiveSessionSql;
  return (strings, ...values) => liveSql(strings, ...values);
}

export type FinalUtteranceInput = {
  confidence: number | null;
  endMs: number;
  id: string;
  sequence: number;
  speaker: 'interviewer' | 'interviewee' | 'unknown';
  startMs: number;
  text: string;
};

export type PersistedTranscriptItem = Omit<FinalUtteranceInput, 'speaker'> & {
  partial: false;
  speaker: 'Interviewer' | 'Participant';
  timestamp: string;
};

export type LiveSessionSnapshot = {
  guidance: { provider: ConfigurableProvider; text: string } | null;
  notes: string[];
  transcript: PersistedTranscriptItem[];
};

function timestampFromMilliseconds(value: number): string {
  const seconds = Math.max(0, Math.floor(value / 1000));
  const minutesPart = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secondsPart = (seconds % 60).toString().padStart(2, '0');
  return `${minutesPart}:${secondsPart}`;
}

export async function listLiveSessionSnapshot(
  sql: LiveSessionSql,
  owner: Owner,
  sessionId: string,
): Promise<LiveSessionSnapshot> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  ) {
    return { guidance: null, notes: [], transcript: [] };
  }
  const [utteranceRows, noteRows, guidanceRows] = await Promise.all([
    sql`
      select id, sequence, speaker, text, start_ms, end_ms, confidence
      from public.utterances
      where session_id = ${sessionId} and user_id = ${owner.sub}
      order by sequence asc
    `,
    sql`
      select body, idempotency_key
      from public.session_notes
      where session_id = ${sessionId} and user_id = ${owner.sub}
      order by created_at asc
    `,
    sql`
      select provider, result_text
      from public.guidance_events
      where session_id = ${sessionId} and user_id = ${owner.sub}
      order by created_at desc
      limit 1
    `,
  ]);

  const latestGuidance = guidanceRows[0];
  const guidance =
    latestGuidance &&
    (latestGuidance.provider === 'openai' ||
      latestGuidance.provider === 'gemini') &&
    typeof latestGuidance.result_text === 'string'
      ? {
          provider: latestGuidance.provider as ConfigurableProvider,
          text: latestGuidance.result_text,
        }
      : null;

  return {
    guidance,
    notes: noteRows.flatMap((row) =>
      typeof row.body === 'string' ? [row.body] : [],
    ),
    transcript: utteranceRows.map((row) => {
      const speaker =
        row.speaker === 'interviewer' ? 'Interviewer' : 'Participant';
      const startMs = Number(row.start_ms);
      return {
        confidence: typeof row.confidence === 'number' ? row.confidence : null,
        endMs: Number(row.end_ms),
        id: String(row.id),
        partial: false,
        sequence: Number(row.sequence),
        speaker,
        startMs,
        text: String(row.text),
        timestamp: timestampFromMilliseconds(startMs),
      };
    }),
  };
}

export async function saveSessionConsent(
  sql: LiveSessionSql,
  owner: Owner,
  sessionId: string,
  sources: Array<'microphone' | 'browser-tab'>,
): Promise<boolean> {
  const rows = await sql`
    update public.sessions
    set
      capture_sources = ${sources},
      consent_version = ${'capture-consent-v1'},
      consented_at = now(),
      status = ${'ready'},
      updated_at = now()
    where id = ${sessionId} and user_id = ${owner.sub}
    returning id
  `;
  return rows.length > 0;
}

export async function hasSessionConsent(
  sql: LiveSessionSql,
  owner: Owner,
  sessionId: string,
): Promise<boolean> {
  const rows = await sql`
    select id
    from public.sessions
    where id = ${sessionId}
      and user_id = ${owner.sub}
      and consented_at is not null
      and consent_version = ${'capture-consent-v1'}
      and cardinality(capture_sources) > 0
    limit 1
  `;
  return rows.length > 0;
}

export async function saveFinalUtterance(
  sql: LiveSessionSql,
  owner: Owner,
  sessionId: string,
  input: FinalUtteranceInput,
): Promise<boolean> {
  const rows = await sql`
    insert into public.utterances (
      id, user_id, session_id, sequence, speaker, text,
      start_ms, end_ms, confidence, is_final
    )
    select
      ${input.id}, ${owner.sub}, sessions.id, ${input.sequence},
      ${input.speaker}, ${input.text}, ${input.startMs}, ${input.endMs},
      ${input.confidence}, ${true}
    from public.sessions where id = ${sessionId} and user_id = ${owner.sub}
    on conflict (session_id, sequence)
    do update set
      speaker = excluded.speaker,
      text = excluded.text,
      start_ms = excluded.start_ms,
      end_ms = excluded.end_ms,
      confidence = excluded.confidence,
      is_final = true
    returning id
  `;
  return rows.length > 0;
}

export async function saveSessionNote(
  sql: LiveSessionSql,
  owner: Owner,
  sessionId: string,
  input: { body: string; idempotencyKey: string },
): Promise<boolean> {
  const rows = await sql`
    insert into public.session_notes (
      user_id, session_id, idempotency_key, body
    )
    select ${owner.sub}, sessions.id, ${input.idempotencyKey}, ${input.body}
    from public.sessions where id = ${sessionId} and user_id = ${owner.sub}
    on conflict (session_id, idempotency_key)
    do update set body = excluded.body
    returning id
  `;
  return rows.length > 0;
}

export async function saveDetectedQuestion(
  sql: LiveSessionSql,
  owner: Owner,
  sessionId: string,
  input: {
    confidence: number | null;
    sourceUtteranceId: string;
    text: string;
  },
): Promise<boolean> {
  const rows = await sql`
    insert into public.questions (
      id, user_id, session_id, source_utterance_id,
      text, confidence, detected_ms
    )
    select
      ${`question-${input.sourceUtteranceId}`}, ${owner.sub}, sessions.id,
      utterances.id, ${input.text}, ${input.confidence}, utterances.end_ms
    from public.sessions
    join public.utterances
      on utterances.session_id = sessions.id
      and utterances.id = ${input.sourceUtteranceId}
      and utterances.user_id = ${owner.sub}
    where sessions.id = ${sessionId} and sessions.user_id = ${owner.sub}
    on conflict (session_id, source_utterance_id)
    do update set
      text = excluded.text,
      confidence = excluded.confidence,
      detected_ms = excluded.detected_ms
    returning id
  `;
  return rows.length > 0;
}

export async function saveGuidanceEvent(
  sql: LiveSessionSql,
  owner: Owner,
  sessionId: string,
  input: {
    idempotencyKey: string;
    provider: ConfigurableProvider;
    text: string;
  },
): Promise<boolean> {
  const rows = await sql`
    insert into public.guidance_events (
      user_id, session_id, idempotency_key, provider, result_text
    )
    select
      ${owner.sub}, sessions.id, ${input.idempotencyKey},
      ${input.provider}, ${input.text}
    from public.sessions where id = ${sessionId} and user_id = ${owner.sub}
    on conflict (session_id, idempotency_key)
    do update set
      provider = excluded.provider,
      result_text = excluded.result_text
    returning id
  `;
  return rows.length > 0;
}
