import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  listProviderCredentialSummaries,
  type ProviderCredentialSql,
  saveProviderCredential,
} from './repository.js';

function createSql(rows: unknown[][]) {
  const calls: Array<{ text: string; values: unknown[] }> = [];
  const sql: ProviderCredentialSql = async (strings, ...values) => {
    calls.push({ text: strings.join('?'), values });
    return (rows.shift() ?? []) as never;
  };

  return { calls, sql };
}

describe('provider credential repository', () => {
  it('lists only the current owner summary without selecting encrypted keys', async () => {
    const database = createSql([
      [
        {
          key_hint: '7890',
          model: 'gpt-4.1-mini',
          provider: 'openai',
          updated_at: '2026-08-14T00:00:00.000Z',
        },
      ],
    ]);

    await expect(
      listProviderCredentialSummaries(database.sql, { sub: 'owner-1' }),
    ).resolves.toEqual([
      {
        keyHint: '7890',
        model: 'gpt-4.1-mini',
        provider: 'openai',
        updatedAt: '2026-08-14T00:00:00.000Z',
      },
    ]);

    expect(database.calls[0]?.values).toEqual(['owner-1']);
    expect(database.calls[0]?.text).not.toContain('encrypted_api_key');
  });

  it('upserts an encrypted value scoped to the authenticated owner', async () => {
    const database = createSql([[]]);

    await saveProviderCredential(
      database.sql,
      { sub: 'owner-1' },
      {
        encryptedApiKey: 'opaque-ciphertext',
        keyHint: '7890',
        model: 'gpt-4.1-mini',
        provider: 'openai',
      },
    );

    expect(database.calls[0]?.values).toEqual([
      'owner-1',
      'openai',
      'opaque-ciphertext',
      'gpt-4.1-mini',
      '7890',
    ]);
    expect(database.calls[0]?.text).toContain(
      'on conflict (user_id, provider)',
    );
  });
});
