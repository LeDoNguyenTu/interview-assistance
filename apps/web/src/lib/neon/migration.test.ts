import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  process.cwd(),
  '../../database/migrations/202608121_neon_sessions.sql',
);
const providerCredentialsMigrationPath = resolve(
  process.cwd(),
  '../../database/migrations/202608122_provider_credentials.sql',
);
const liveSessionMigrationPath = resolve(
  process.cwd(),
  '../../database/migrations/202608123_live_session_events.sql',
);

describe('Neon session migration', () => {
  it('defines an owner-scoped sessions table without a Supabase auth dependency', () => {
    const migration = readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('create table if not exists public.sessions');
    expect(migration).toContain('user_id text not null');
    expect(migration).toContain('sessions_user_id_created_at_idx');
    expect(migration).not.toContain('auth.users');
    expect(migration).not.toContain('storage.objects');
  });

  it('defines owner-scoped encrypted provider credentials', () => {
    const migration = readFileSync(providerCredentialsMigrationPath, 'utf8');

    expect(migration).toContain(
      'create table if not exists public.provider_credentials',
    );
    expect(migration).toContain('user_id text not null');
    expect(migration).toContain("provider in ('openai', 'gemini')");
    expect(migration).toContain('encrypted_api_key text not null');
    expect(migration).not.toContain('auth.users');
  });

  it('defines durable transcript, question, note, and guidance records', () => {
    const migration = readFileSync(liveSessionMigrationPath, 'utf8');

    expect(migration).toContain('create table if not exists public.utterances');
    expect(migration).toContain('create table if not exists public.questions');
    expect(migration).toContain(
      'create table if not exists public.session_notes',
    );
    expect(migration).toContain(
      'create table if not exists public.guidance_events',
    );
    expect(migration).toContain('unique (session_id, sequence)');
    expect(migration).toContain('unique (session_id, idempotency_key)');
  });
});
