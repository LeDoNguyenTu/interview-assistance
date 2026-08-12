import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  parseYamlDocument,
  validateWorkflowDocument,
} from '../validate-ci-workflows.mjs';

const fixture = async (name) =>
  readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('does not treat a command in a YAML comment as a runnable quality step', async () => {
  const document = await parseYamlDocument(
    await fixture('quality-command-in-comment.yml'),
  );

  const failures = validateWorkflowDocument(
    '.github/workflows/quality.yml',
    document,
  );

  assert.ok(
    failures.some((failure) => failure.includes('pnpm build')),
    `expected a missing pnpm build failure, received: ${failures.join('; ')}`,
  );
});

test('rejects a mutable action tag even when the action name is approved', async () => {
  const document = await parseYamlDocument(
    await fixture('quality-unpinned-action.yml'),
  );

  const failures = validateWorkflowDocument(
    '.github/workflows/quality.yml',
    document,
  );

  assert.ok(
    failures.some((failure) => failure.includes('immutable SHA')),
    `expected an immutable SHA failure, received: ${failures.join('; ')}`,
  );
});
