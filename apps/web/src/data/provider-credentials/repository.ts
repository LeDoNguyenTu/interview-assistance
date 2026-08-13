import 'server-only';

import type { NeonSql } from '../../lib/neon/database';

import type { ConfigurableProvider } from './input';

type CredentialSummaryRow = {
  key_hint: string;
  model: string;
  provider: string;
  updated_at: string;
};

type ProviderCredentialRow = CredentialSummaryRow & {
  encrypted_api_key: string;
};

type ValidatedOwner = { sub: string };

export type ProviderCredentialSql = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Array<CredentialSummaryRow | ProviderCredentialRow>>;

export type ProviderCredentialSummary = {
  keyHint: string;
  model: string;
  provider: ConfigurableProvider;
  updatedAt: string;
};

export type StoredProviderCredential = ProviderCredentialSummary & {
  encryptedApiKey: string;
};

export type SaveProviderCredentialInput = {
  encryptedApiKey: string;
  keyHint: string;
  model: string;
  provider: ConfigurableProvider;
};

export function asProviderCredentialSql(sql: NeonSql): ProviderCredentialSql {
  const credentialSql = sql as unknown as ProviderCredentialSql;
  return (strings, ...values) => credentialSql(strings, ...values);
}

function provider(value: string): ConfigurableProvider {
  if (value === 'openai' || value === 'gemini') return value;
  throw new Error('The provider credential could not be loaded.');
}

function mapSummary(row: CredentialSummaryRow): ProviderCredentialSummary {
  return {
    keyHint: row.key_hint,
    model: row.model,
    provider: provider(row.provider),
    updatedAt: row.updated_at,
  };
}

export async function listProviderCredentialSummaries(
  sql: ProviderCredentialSql,
  owner: ValidatedOwner,
): Promise<ProviderCredentialSummary[]> {
  const rows = (await sql`
    select provider, model, key_hint, updated_at
    from public.provider_credentials
    where user_id = ${owner.sub}
    order by provider asc
  `) as CredentialSummaryRow[];

  return rows.map(mapSummary);
}

export async function getStoredProviderCredential(
  sql: ProviderCredentialSql,
  owner: ValidatedOwner,
  selectedProvider: ConfigurableProvider,
): Promise<StoredProviderCredential | null> {
  const [row] = (await sql`
    select provider, model, key_hint, updated_at, encrypted_api_key
    from public.provider_credentials
    where user_id = ${owner.sub} and provider = ${selectedProvider}
    limit 1
  `) as ProviderCredentialRow[];

  return row
    ? { ...mapSummary(row), encryptedApiKey: row.encrypted_api_key }
    : null;
}

export async function saveProviderCredential(
  sql: ProviderCredentialSql,
  owner: ValidatedOwner,
  input: SaveProviderCredentialInput,
): Promise<void> {
  await sql`
    insert into public.provider_credentials (
      user_id,
      provider,
      encrypted_api_key,
      model,
      key_hint
    )
    values (
      ${owner.sub},
      ${input.provider},
      ${input.encryptedApiKey},
      ${input.model},
      ${input.keyHint}
    )
    on conflict (user_id, provider)
    do update set
      encrypted_api_key = excluded.encrypted_api_key,
      model = excluded.model,
      key_hint = excluded.key_hint,
      updated_at = now()
  `;
}

export async function deleteProviderCredential(
  sql: ProviderCredentialSql,
  owner: ValidatedOwner,
  selectedProvider: ConfigurableProvider,
): Promise<void> {
  await sql`
    delete from public.provider_credentials
    where user_id = ${owner.sub} and provider = ${selectedProvider}
  `;
}
