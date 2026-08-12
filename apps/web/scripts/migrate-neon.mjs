import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@neondatabase/serverless';

const scriptsDirectory = fileURLToPath(new URL('.', import.meta.url));
const migrationPath = resolve(
  scriptsDirectory,
  '../../../database/migrations/202608121_neon_sessions.sql',
);
const connectionString =
  process.env.candorlens_DATABASE_URL_UNPOOLED ??
  process.env.candorlens_DATABASE_URL;

if (!connectionString) {
  throw new Error('Neon database configuration is missing.');
}

const client = new Client(connectionString);

try {
  await client.connect();
  await client.query(await readFile(migrationPath, 'utf8'));
  console.log('Applied Neon session migration.');
} finally {
  await client.end();
}
