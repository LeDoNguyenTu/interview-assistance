import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@neondatabase/serverless';

const scriptsDirectory = fileURLToPath(new URL('.', import.meta.url));
const migrationsDirectory = resolve(
  scriptsDirectory,
  '../../../database/migrations',
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
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const migrationName of migrationNames) {
    const migrationPath = resolve(migrationsDirectory, migrationName);
    await client.query(await readFile(migrationPath, 'utf8'));
    console.log(`Applied Neon migration: ${migrationName}`);
  }
} finally {
  await client.end();
}
