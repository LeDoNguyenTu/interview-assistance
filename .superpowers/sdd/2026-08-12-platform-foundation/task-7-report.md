# Task 7 report: local Supabase schema and security foundation

## Scope and safeguards

Implemented only in `D:\PROJECTS\InterviewAssistance-platform-foundation` on the requested platform-foundation branch. No `supabase link`, `db push`, `db pull`, remote reset, remote migration repair, remote query, push, or other remote Supabase command was run.

## Docs and CLI discovery

- Read Task 7 from `docs/superpowers/plans/2026-08-12-platform-foundation.md`, Task 7 brief, and runbook sections 8, 9, and 13 before implementation.
- Read the local Supabase skill and current official local-development, workflow, pgTAP, linting, and configuration documentation. The current guidance confirms local-first work, explicit Data API grants with RLS, config-managed private buckets, transaction-scoped pgTAP role/JWT testing, and `supabase gen types --local` for local type generation.
- The workspace did not yet contain the CLI. Added the exact pinned dev dependency `supabase@2.113.0` using `corepack pnpm` and committed the lockfile update.
- Consulted `--help` for `supabase`, `migration new`, `gen types`, `test db`, `db lint`, and `init` before command use.
- Used the pinned CLI to run `supabase init` and `supabase migration new platform_foundation`. The CLI generated `supabase/migrations/20260812010234_platform_foundation.sql`; the timestamp was not hand-invented.

## Red-green evidence

### pgTAP red

Created `supabase/tests/platform_foundation.test.sql` while the generated migration was empty. The intended first local database test could not execute because the Docker Desktop Linux engine is not running; the CLI returned `LegacyDbConnectError` and connection refusal on `127.0.0.1:54322`. Therefore the absent-object pgTAP red condition is present in the test file but cannot be observed locally in this environment.

### Mapper red

Created `packages/core/src/database/mappers.test.ts` before `mappers.ts`. Running:

```powershell
corepack pnpm --filter @candorlens/core test -- src/database/mappers.test.ts
```

failed as expected with `Cannot find module './mappers.js' imported from .../mappers.test.ts`.

### Green

Implemented pure mapper code after the failure. The same test command then passed, and the complete core package gate passed:

```text
Test Files 3 passed (3)
Tests 15 passed (15)
```

`corepack pnpm --filter @candorlens/core typecheck` and `corepack pnpm --filter @candorlens/core lint` also passed.

## Migration and RLS design

Created these UUID-owned public tables: `profiles`, `documents`, `interview_profiles`, `sessions`, `recordings`, `utterances`, `questions`, `guidance_events`, `reports`, and `usage_events`.

- Each has `user_id uuid not null references auth.users(id) on delete cascade`, `created_at`, and `updated_at`.
- Constraints cover accepted enum values, consent pairing/state, non-negative timing/count fields, confidence range, storage byte limits, and owner-prefixed document/recording storage paths.
- Owner and session indexes support the expected access paths. Utterances have unique `(session_id, sequence)`; guidance and report operations use session-scoped idempotency keys.
- Every application table has RLS enabled, explicit authenticated CRUD grants, anon revocation, and per-operation policies `TO authenticated`. Updates supply both `USING` and `WITH CHECK` ownership predicates.
- Directly owned records use `auth.uid() = user_id`. Session children additionally require a parent session owned by `auth.uid()`; a client-supplied child `user_id` is not sufficient.
- No authorization reads `user_metadata`; no service-role/client setup was added.
- Created a private `private.set_updated_at` trigger function and revoked public execute. No managed `auth`, `storage`, or `realtime` table/function definitions were changed.
- `config.toml` declares private `documents`, `recordings`, and `exports` buckets. Storage object RLS policies permit only authenticated user-ID-prefixed object names in those buckets; no bucket is public.

## Database tests

The pgTAP suite declares 30 assertions covering:

- all required tables, RLS, unique index, and constraint;
- anonymous read/write denial;
- owner create/read;
- second-user read/update/delete denial;
- second-user child insertion denial;
- ownership-change denial;
- document size, consent, and confidence constraints;
- document, recording, and export private path cross-user denial.

## Types and mappers

`packages/core/src/database/types.ts` is generated-shaped local Database typing for the foundation tables. Actual `supabase gen types --local` could not run without the local database; regenerating from the locally running stack is the required follow-up once Docker is available.

`mapSessionRow` is a pure snake_case-to-domain mapper using the existing Zod domain schema. Tests prove timestamps and cleared nullable fields remain intact, while invalid stored enum values are rejected.

## Local verification

Passed:

```powershell
corepack pnpm --filter @candorlens/core test
corepack pnpm --filter @candorlens/core typecheck
corepack pnpm --filter @candorlens/core lint
corepack pnpm exec prettier --check packages/core/src/database/types.ts packages/core/src/database/mappers.ts packages/core/src/database/mappers.test.ts packages/core/src/index.ts
git diff --check
```

Static counts: 10 RLS-enabled public application tables, 40 table policies, and 30 pgTAP assertions.

The repository-wide format check is pre-existingly red in 28 files outside this task (including desktop/web/UI files and existing core files); it was not modified as unrelated scope.

## Blocker

Docker is installed but Docker Desktop's Linux engine is stopped/unavailable. The final one-shot local-only attempts produced:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified

failed to connect to `host=127.0.0.1 user=postgres database=postgres`: dial error
(connect ECONNREFUSED 127.0.0.1:54322)
```

Consequently these local-only checks could not run: `supabase start`, `supabase db reset --local`, `supabase test db`, `supabase db lint --local --level warning`, and `supabase gen types --local`. The issue was not retried in a loop and no remote fallback was used.

## Changed files

- `package.json`, `pnpm-lock.yaml`
- `supabase/config.toml`
- `supabase/migrations/20260812010234_platform_foundation.sql`
- `supabase/tests/platform_foundation.test.sql`
- `supabase/seed.sql`
- `packages/core/src/database/types.ts`
- `packages/core/src/database/mappers.ts`
- `packages/core/src/database/mappers.test.ts`
- `packages/core/src/index.ts`
