import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  process.cwd(),
  '../../database/migrations/202608121_neon_sessions.sql',
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
});
