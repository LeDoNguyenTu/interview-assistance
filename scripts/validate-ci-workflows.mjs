import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { __debug } from 'prettier';

const immutableSha = /^[^@\s]+@[a-f0-9]{40}$/;

const workflowSpecs = {
  '.github/workflows/quality.yml': {
    job: 'quality',
    runner: 'ubuntu-24.04',
    triggers: ['pull_request', 'push'],
    actions: [
      'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
      'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
      'actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830',
    ],
    commands: [
      'pnpm install --frozen-lockfile',
      'pnpm ci:validate:test',
      'pnpm ci:validate',
      'pnpm format:check',
      'pnpm lint',
      'pnpm typecheck',
      'pnpm test',
      'pnpm build',
    ],
  },
  '.github/workflows/database.yml': {
    job: 'database',
    runner: 'ubuntu-24.04',
    triggers: ['pull_request', 'push'],
    actions: [
      'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
      'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
    ],
    commands: [
      'pnpm install --frozen-lockfile',
      'pnpm exec supabase start',
      'pnpm exec supabase db reset',
      'pnpm exec supabase test db',
      'pnpm exec supabase db lint --level warning',
    ],
  },
  '.github/workflows/desktop.yml': {
    job: 'desktop',
    runner: 'windows-2025',
    triggers: ['pull_request', 'push'],
    actions: [
      'actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09',
      'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
      'dtolnay/rust-toolchain@4360b52568e2003a75bf9bc1d59f33a8e3fc893c',
    ],
    commands: [
      'pnpm install --frozen-lockfile',
      'cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml --all -- --check',
      'cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings',
      'cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml',
      'pnpm --filter @candorlens/desktop test',
      'pnpm --filter @candorlens/desktop tauri build --debug',
    ],
  },
};

const dependabotFile = '.github/dependabot.yml';

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function yamlNodeToValue(node) {
  if (!node) {
    return null;
  }

  if (node.type === 'root') {
    const document = node.children?.find((child) => child.type === 'document');
    return yamlNodeToValue(document);
  }

  if (node.type === 'document') {
    const body = node.children?.find((child) => child.type === 'documentBody');
    return yamlNodeToValue(body);
  }

  if (
    node.type === 'documentBody' ||
    node.type === 'mappingValue' ||
    node.type === 'mappingKey' ||
    node.type === 'sequenceItem'
  ) {
    return yamlNodeToValue(node.children?.[0]);
  }

  if (node.type === 'mapping') {
    return Object.fromEntries(
      (node.children ?? []).map((item) => {
        const key = item.children?.find((child) => child.type === 'mappingKey');
        const value = item.children?.find(
          (child) => child.type === 'mappingValue',
        );
        return [String(yamlNodeToValue(key)), yamlNodeToValue(value)];
      }),
    );
  }

  if (node.type === 'sequence') {
    return (node.children ?? []).map((item) => yamlNodeToValue(item));
  }

  if (Object.hasOwn(node, 'value')) {
    return node.value;
  }

  return null;
}

export async function parseYamlDocument(source) {
  const { ast } = await __debug.parse(source, { parser: 'yaml' });
  return yamlNodeToValue(ast);
}

function validatePermissions(file, permissions) {
  if (
    !isObject(permissions) ||
    Object.keys(permissions).length !== 1 ||
    permissions.contents !== 'read'
  ) {
    return [`${file} must grant only permissions.contents: read`];
  }

  return [];
}

function validateRisk(value, path = '') {
  const failures = [];

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      failures.push(...validateRisk(item, `${path}[${index}]`));
    }
    return failures;
  }

  if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (key.toLowerCase() === 'env') {
        failures.push(`${nextPath} must not be present`);
      }
      failures.push(...validateRisk(item, nextPath));
    }
    return failures;
  }

  if (typeof value === 'string') {
    const lowerCaseValue = value.toLowerCase();
    for (const prohibited of [
      'secrets.',
      '.env',
      'supabase link',
      'supabase db push',
      'vercel',
      'deploy',
      'publish',
      ' release',
    ]) {
      if (lowerCaseValue.includes(prohibited)) {
        failures.push(
          `${path} contains prohibited CI content: ${prohibited.trim()}`,
        );
      }
    }
  }

  return failures;
}

function collectActionSteps(value, steps = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectActionSteps(item, steps);
    }
    return steps;
  }

  if (isObject(value)) {
    if (typeof value.uses === 'string') {
      steps.push(value);
    }
    for (const item of Object.values(value)) {
      collectActionSteps(item, steps);
    }
  }

  return steps;
}

function validateActionPins(file, steps) {
  const failures = [];

  for (const [index, step] of steps.entries()) {
    if (typeof step?.uses === 'string' && !immutableSha.test(step.uses)) {
      failures.push(`${file} steps[${index}].uses must use an immutable SHA`);
    }
  }

  return failures;
}

function validateNodeAndPnpm(file, steps) {
  const failures = [];
  const pnpmSetup = steps.find((step) =>
    step?.uses?.startsWith('pnpm/action-setup@'),
  );
  const nodeSetup = steps.find((step) =>
    step?.uses?.startsWith('actions/setup-node@'),
  );

  if (pnpmSetup?.with?.version !== '11.21.0') {
    failures.push(`${file} must set pnpm/action-setup version to 11.21.0`);
  }

  if (nodeSetup?.with?.['node-version'] !== '24') {
    failures.push(`${file} must set actions/setup-node node-version to 24`);
  }

  if (nodeSetup?.with?.cache !== 'pnpm') {
    failures.push(`${file} must cache the pnpm store with actions/setup-node`);
  }

  return failures;
}

function validateCachePaths(file, steps) {
  const failures = [];

  for (const [index, step] of steps.entries()) {
    if (
      step?.uses?.startsWith('actions/cache@') &&
      step?.with?.path !== '.turbo'
    ) {
      failures.push(`${file} steps[${index}] may cache only .turbo`);
    }
  }

  return failures;
}

export function validateWorkflowDocument(file, document) {
  const spec = workflowSpecs[file];
  if (!spec) {
    return [`${file} is not a recognized workflow`];
  }

  const failures = [
    ...validatePermissions(file, document.permissions),
    ...validateRisk(document),
  ];

  for (const trigger of spec.triggers) {
    if (!Object.hasOwn(document.on ?? {}, trigger)) {
      failures.push(`${file} must trigger on ${trigger}`);
    }
  }

  if (!isObject(document.jobs) || Object.keys(document.jobs).length !== 1) {
    failures.push(`${file} must define exactly one CI job`);
  }

  const job = document.jobs?.[spec.job];
  if (!isObject(job)) {
    failures.push(`${file} must define jobs.${spec.job}`);
    return failures;
  }

  if (job['runs-on'] !== spec.runner) {
    failures.push(`${file} jobs.${spec.job}.runs-on must be ${spec.runner}`);
  }

  if (!Array.isArray(job.steps)) {
    failures.push(`${file} jobs.${spec.job}.steps must be a sequence`);
    return failures;
  }

  const runCommands = job.steps
    .filter((step) => typeof step?.run === 'string')
    .map((step) => step.run);
  for (const [index, command] of spec.commands.entries()) {
    if (runCommands[index] !== command) {
      failures.push(`${file} runnable step ${index + 1} must be ${command}`);
    }
  }
  if (runCommands.length !== spec.commands.length) {
    failures.push(
      `${file} must contain only the required ordered runnable steps`,
    );
  }

  const actionSteps = collectActionSteps(document);
  const actions = actionSteps.map((step) => step.uses);
  for (const action of spec.actions) {
    if (!actions.includes(action)) {
      failures.push(`${file} must use ${action}`);
    }
  }
  for (const action of actions) {
    if (!spec.actions.includes(action)) {
      failures.push(`${file} must not use unreviewed action ${action}`);
    }
  }

  failures.push(
    ...validateActionPins(file, actionSteps),
    ...validateNodeAndPnpm(file, job.steps),
    ...validateCachePaths(file, actionSteps),
  );

  return failures;
}

export function validateDependabotDocument(document) {
  const failures = validateRisk(document);
  const ecosystems = new Set(
    Array.isArray(document.updates)
      ? document.updates.map((update) => update?.['package-ecosystem'])
      : [],
  );

  if (String(document.version) !== '2') {
    failures.push(`${dependabotFile} must set version: 2`);
  }
  for (const ecosystem of ['npm', 'github-actions']) {
    if (!ecosystems.has(ecosystem)) {
      failures.push(`${dependabotFile} must update ${ecosystem}`);
    }
  }

  return failures;
}

export async function validateCiWorkflows(rootDirectory = process.cwd()) {
  const failures = [];

  for (const file of [...Object.keys(workflowSpecs), dependabotFile]) {
    try {
      const source = await readFile(resolve(rootDirectory, file), 'utf8');
      const document = await parseYamlDocument(source);
      failures.push(
        ...(file === dependabotFile
          ? validateDependabotDocument(document)
          : validateWorkflowDocument(file, document)),
      );
    } catch (error) {
      const detail =
        error?.code === 'ENOENT'
          ? 'is missing'
          : `is not valid YAML: ${error.message}`;
      failures.push(`${file} ${detail}`);
    }
  }

  return failures;
}

async function main() {
  const failures = await validateCiWorkflows();
  if (failures.length > 0) {
    throw new Error(
      `CI workflow validation failed:\n- ${failures.join('\n- ')}`,
    );
  }

  console.log(
    'CI workflows parse structurally and meet the required non-deploying gate policy.',
  );
}

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
