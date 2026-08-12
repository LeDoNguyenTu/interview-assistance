import { sessionRecordSchema } from '../session/schema.js';
import type { SessionRecord } from '../session/schema.js';

import type { Database } from './types.js';

export type SessionRow = Database['public']['Tables']['sessions']['Row'];

export function mapSessionRow(row: SessionRow): SessionRecord {
  return sessionRecordSchema.parse({
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    mode: row.mode,
    status: row.status,
    providerId: row.provider,
    captureSources: row.capture_sources,
    consentedAt: row.consented_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
