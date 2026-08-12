import 'server-only';

import { neon } from '@neondatabase/serverless';

export type NeonSql = ReturnType<typeof neon>;

let neonSql: NeonSql | undefined;

export function getNeonDatabaseUrl(): string {
  const databaseUrl = process.env.candorlens_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Neon database configuration is missing.');
  }

  return databaseUrl;
}

export function getNeonSql(): NeonSql {
  neonSql ??= neon(getNeonDatabaseUrl());
  return neonSql;
}
