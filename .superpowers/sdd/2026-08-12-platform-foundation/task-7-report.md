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

## Static review fix round 1

Applied the Task 7 static review corrections without any remote command.

- Replaced the three generated-constraint-message assertions with the documented four-argument `throws_ok(sql, sqlstate, null, description)` form. They now assert only SQLSTATE `23514`, so PostgreSQL-generated constraint names and localized wording cannot make them flaky.
- Made storage limits consistent: the global default is `1GiB`, the private recordings bucket and `recordings.byte_size` cap are `1GiB`, and the documents/exports buckets plus `documents.byte_size` cap remain `50MiB`.
- Removed `profiles_user_id_idx` and `utterances_session_id_sequence_idx`. Those standalone indexes duplicated indexes created by the `profiles.user_id` and `utterances(session_id, sequence)` unique constraints.
- Expanded the pgTAP plan to 87 assertions. It explicitly checks all ten public application tables have RLS, each has check constraints, the relevant constrained fields include negative sequence/duration/token protections, all 15 non-unique access indexes exist, and all four unique owner/sequence/idempotency constraints exist. The existing anonymous, owner, cross-user, ownership-change, child-row, and private storage tests remain.
- Added a focused TypeScript regression test. It initially failed typecheck because `utterances.text` was required despite `text text not null default ''` in the migration. `utterances.Insert.text` is now optional and the test/typecheck pass.

The local Docker engine is still unavailable, so pgTAP, local reset, lint, and actual CLI type generation remain unexecuted. The static review changes do not claim those database tests were run. `types.ts` is a provisional hand-maintained interface, not generated output; it must be replaced by `supabase gen types --local` after Docker is running and the migration passes local reset.

## Local verification resumed

Docker Desktop became available on 2026-08-12. An unrelated local `sales-outreach-tool` stack already owned the default Supabase ports, so this project was started temporarily on unused `5532x` ports. The repository config was restored to its tracked ports after verification; no other local stack was stopped or changed.

Using the existing pinned local Supabase CLI `2.113.0` binary (the `corepack pnpm` wrapper remains blocked by the repository's pre-existing minimum-release-age policy for Supabase JS `2.112.3` packages), the following local-only commands completed:

```powershell
supabase start
supabase db reset --local
supabase test db supabase/tests/platform_foundation.test.sql supabase/tests/session_owner_scope.test.sql
supabase db lint --local --level warning
supabase gen types --local --schema public
```

- Reset applied `20260812010234_platform_foundation.sql` and created the three configured private storage buckets.
- Initial pgTAP execution exposed three test-definition mistakes: owner-prefixed storage checks cover `(storage_path, user_id)`, and utterance time ordering covers `(end_ms, start_ms)`. The corresponding pgTAP tests failed 3 of 87 assertions, were corrected to use the real multi-column constraints, and then passed.
- Final pgTAP result: both Task 7 foundation and Task 9 two-user session tests passed, `Files=2, Tests=89, Result: PASS`.
- Local database lint reported `No schema errors found`.
- `packages/core/src/database/types.ts` is now generated from the local database by the pinned CLI and formatted with the repository formatter; it replaces the provisional hand-maintained type declaration.
- Fresh package-core checks passed using existing local binaries: Vitest `4 files, 16 tests passed`, TypeScript typecheck, ESLint, and targeted Prettier. `git diff --check` passed.

No remote Supabase command was run.
