import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { __debug } from 'prettier';

const workflowFiles = [
  '.github/workflows/quality.yml',
  '.github/workflows/database.yml',
  '.github/workflows/desktop.yml',
  '.github/dependabot.yml',
];

const requiredContent = {
  '.github/workflows/quality.yml': [
    'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
    'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
    'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
    'actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830',
    'node-version: 24',
    'version: 11.21.0',
    'pnpm install --frozen-lockfile',
    'pnpm ci:validate',
    'pnpm format:check',
    'pnpm lint',
    'pnpm typecheck',
    'pnpm test',
    'pnpm build',
    'path: .turbo',
  ],
  '.github/workflows/database.yml': [
    'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
    'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
    'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
    'node-version: 24',
    'version: 11.21.0',
    'pnpm install --frozen-lockfile',
    'pnpm exec supabase start',
    'pnpm exec supabase db reset',
    'pnpm exec supabase test db',
    'pnpm exec supabase db lint --level warning',
  ],
  '.github/workflows/desktop.yml': [
    'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
    'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
    'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
    'dtolnay/rust-toolchain@4360b52568e2003a75bf9bc1d59f33a8e3fc893c',
    'node-version: 24',
    'version: 11.21.0',
    'pnpm install --frozen-lockfile',
    'cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml --all -- --check',
    'cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings',
    'cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml',
    'pnpm --filter @candorlens/desktop test',
    'pnpm --filter @candorlens/desktop tauri build --debug',
  ],
  '.github/dependabot.yml': [
    'version: 2',
    "package-ecosystem: 'npm'",
    "package-ecosystem: 'github-actions'",
  ],
};

const failures = [];

for (const relativePath of workflowFiles) {
  const filePath = resolve(process.cwd(), relativePath);

  try {
    const source = await readFile(filePath, 'utf8');
    await __debug.parse(source, { parser: 'yaml' });

    for (const expected of requiredContent[relativePath]) {
      if (!source.includes(expected)) {
        failures.push(`${relativePath} is missing ${JSON.stringify(expected)}`);
      }
    }

    if (relativePath.endsWith('.yml') && relativePath.includes('workflows')) {
      const lowerCaseSource = source.toLowerCase();
      for (const prohibited of [
        'secrets.',
        'supabase link',
        'supabase db push',
        'vercel',
        'deploy',
        'publish',
        ' release',
      ]) {
        if (lowerCaseSource.includes(prohibited)) {
          failures.push(
            `${relativePath} contains prohibited CI content: ${prohibited.trim()}`,
          );
        }
      }

      if (source.includes('.env')) {
        failures.push(
          `${relativePath} must not cache or load environment files`,
        );
      }
    }
  } catch (error) {
    const detail =
      error?.code === 'ENOENT'
        ? 'is missing'
        : `is not valid YAML: ${error.message}`;
    failures.push(`${relativePath} ${detail}`);
  }
}

if (failures.length > 0) {
  throw new Error(`CI workflow validation failed:\n- ${failures.join('\n- ')}`);
}

console.log(
  'CI workflow YAML files are present, parse successfully, and meet the required gate structure.',
);
