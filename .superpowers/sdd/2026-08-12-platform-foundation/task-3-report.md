# Task 3 report - provider-neutral model contracts

## Outcome

Implemented `@candorlens/models` with provider-neutral transcription, question detection, guidance, and normalized-error contracts. Added a deterministic `FixtureProvider` that implements the guidance, question, and transcription contracts without live provider traffic.

## Red-green evidence

1. Red: created the reusable guidance-provider contract suite and fixture tests before the public models entrypoint or fixture existed.
2. Red command: `corepack pnpm --filter @candorlens/models test`.
3. Red result: failed as expected because `src/fixture/fixture-provider.test.ts` could not import the missing `../index.js` models entrypoint. This was a feature-missing failure, not a test expectation failure.
4. Green: implemented the contracts, safe `ProviderError`, public entrypoint, and deterministic fixture.
5. Green command: `corepack pnpm --filter @candorlens/models test`.
6. Green result: 1 test file and 7 tests passed.

## Tests added

- `runGuidanceProviderContract` is reusable by future Gemini and OpenAI adapter tests.
- The contract suite checks complete provider results, session mismatch validation, and cancellation normalization.
- Fixture tests assert exact stable guidance, deterministic question detection, a complete deterministic transcription event lifecycle, and safe invalid-audio errors.

## Verification

- `corepack pnpm --filter @candorlens/models lint` passed.
- `corepack pnpm --filter @candorlens/models typecheck` passed.
- `corepack pnpm --filter @candorlens/models test` passed: 7 tests.
- `corepack pnpm exec prettier --check packages/models` passed.
- `git diff --check` passed.

## Changed files

- Added the `@candorlens/models` workspace package and lockfile importer.
- Added public contracts for transcription, questions, guidance, and normalized provider errors.
- Added `FixtureProvider`, the reusable guidance contract suite, and fixture tests.
- Added the task report.

## Self-review

- All public package exports are routed through `src/index.ts`.
- Provider identity and session modes are imported from `@candorlens/core` rather than duplicated.
- `ProviderError` derives its messages solely from known error codes and exposes no raw provider payload or cause.
- The fixture has no provider SDKs, network calls, random values, clocks, capture, stealth, or hidden behavior.
- Cancellation is checked before work and after the fixture's asynchronous boundary. Transcription events use typed subscriptions and fixed values.

## Concerns and deferred work

- The fixture deliberately models only synthetic byte-count usage and transcript events. Real audio encoding, provider SDK error mapping, schema validation, retries, and live provider clients belong to later adapter work.
- The shared contract intentionally tests provider-neutral guarantees only. Adapter-specific structured-output behavior and provider error cases remain for the Gemini and OpenAI task.

## Review fix round 1

### Red-green evidence

1. Added focused tests before changing behavior for runtime entrypoint isolation, transcript invariants, detection input invariants, and cancellation recovery.
2. Red command: `corepack pnpm --filter @candorlens/models test`.
3. Red result: 6 failures across 13 tests. The runtime entrypoint exposed `runGuidanceProviderContract`; mixed and malformed transcript input resolved; and cancelling connect or finish left `connecting` or `finishing` state that rejected a subsequent permitted operation.
4. Green command: `corepack pnpm --filter @candorlens/models test`.
5. Green result: 2 test files and 13 tests passed.

### Fixes

- Moved the Vitest-based reusable suite behind the explicit `@candorlens/models/testing` export. The runtime `@candorlens/models` entrypoint no longer re-exports a module that imports Vitest.
- Strengthened the shared guidance contract suite to assert exact safe invalid-request and cancellation messages, plus no `cause`, `payload`, `rawPayload`, or `response` fields.
- Added public provider-neutral validation helpers for guidance requests, transcript segments, and question-detection input. They require request-session ownership for guidance segments; non-negative integer sequences; non-negative, ordered timestamps; and confidence values in the inclusive 0 to 1 range or null where allowed. Detection input must also contain one session and strictly increasing sequences with non-decreasing starts.
- The fixture now restores `idle` and clears connection state when connect is cancelled after transition, and restores `connected` when finish is cancelled. Tests prove a new connection or subsequent audio and finish operation succeeds.

### Workspace dependency policy

`@candorlens/models` remains private and uses `@candorlens/core: workspace:*`, which is the pnpm workspace protocol for a local sibling dependency rather than a published semver dependency. Repository evidence: `pnpm-workspace.yaml` enables `saveExact: true`, while `pnpm-lock.yaml` resolves this specifier as `link:../core`. Because this package is `private: true`, it has no publish-time dependency manifest; therefore `workspace:*` does not violate an external published-version policy in this repository. Fixed external package pins, including `vitest: 4.1.10`, remain unchanged.

### Review verification

- `corepack pnpm --filter @candorlens/models lint` passed.
- `corepack pnpm --filter @candorlens/models typecheck` passed.
- `corepack pnpm --filter @candorlens/models test` passed: 13 tests.
- `corepack pnpm exec prettier --check packages/models` passed.
- `git diff --check` passed.
