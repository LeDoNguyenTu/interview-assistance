# Neon Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move CandorLens web authentication and session persistence from Supabase runtime services to the connected Vercel Neon resource without weakening owner isolation.

**Architecture:** Use `@neondatabase/auth` with the connected Neon Auth base URL and a server-only signed-cookie secret. Use the Neon serverless driver only in server components, server actions, and route handlers. Store authenticated owner IDs as text in Postgres and enforce owner filtering in every repository query. Keep the existing Supabase migration as historical source material only; no browser client will receive a database credential.

**Tech Stack:** Next.js 16 App Router, React 19, `@neondatabase/auth`, `@neondatabase/serverless`, PostgreSQL, Vitest, Testing Library, Vercel environments.

## Global Constraints

- Use `candorlens_DATABASE_URL` and `candorlens_NEON_AUTH_BASE_URL` only on the server.
- Use `NEON_AUTH_COOKIE_SECRET` only on the server and never commit environment files.
- Keep explicit consent, visible fixture behavior, human review, and all existing no-stealth product boundaries.
- Do not make direct database calls from client components.
- Every session lookup, list, or creation uses the authenticated owner ID as a query value.
- New user-facing copy uses normal hyphens only.

---

### Task 1: Add safe Neon configuration and migration runner

**Files:**
- Create: `apps/web/src/lib/neon/database.ts`
- Create: `apps/web/src/lib/neon/database.test.ts`
- Create: `apps/web/scripts/migrate-neon.mjs`
- Create: `database/migrations/202608121_neon_sessions.sql`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces `getNeonSql(): NeonQuery` and `getNeonDatabaseUrl(): string`.
- Produces `pnpm --filter @candorlens/web db:migrate`, which reads `.env.local` through Node's `--env-file` option and applies the versioned SQL migration through a one-shot Neon client.

- [ ] **Step 1: Write failing configuration tests.** Assert missing `candorlens_DATABASE_URL` throws `Neon database configuration is missing.` and a supplied value initializes the client lazily.
- [ ] **Step 2: Run the focused test.** Run `corepack pnpm --filter @candorlens/web test -- database.test.ts` and confirm the missing module failure.
- [ ] **Step 3: Add exact dependencies.** Add `@neondatabase/serverless@1.0.2` and `@neondatabase/auth@0.4.2-beta`, preserving the workspace release-age policy. Mock the server-only Neon Auth module in Vitest because its Next server peer is resolved by the production compiler rather than the test resolver.
- [ ] **Step 4: Implement the lazy server-only driver.** Construct `neon(getNeonDatabaseUrl())` inside `getNeonSql`, never at module evaluation time.
- [ ] **Step 5: Add the initial schema.** Create `sessions` with UUID identity, owner text, mode/provider/status checks, consent fields, timestamps, and a `(user_id, created_at desc)` index. The migration is idempotent and contains no Supabase roles, policies, storage, or `auth.users` references.
- [ ] **Step 6: Add the migration runner.** Read the SQL file, create a Neon `Client` from the unpooled URL when present, execute the migration once, and always close the client.
- [ ] **Step 7: Re-run the focused tests and static checks.** Run the new test, web typecheck, and web lint.
- [ ] **Step 8: Apply and verify the migration.** Run `corepack pnpm --filter @candorlens/web db:migrate` against the connected Neon development database, then query the information schema using a read-only verification command.

### Task 2: Replace Supabase authentication with Neon Auth

**Files:**
- Create: `apps/web/src/lib/auth/neon-auth.ts`
- Create: `apps/web/src/lib/auth/neon-auth.test.ts`
- Create: `apps/web/src/app/api/auth/[...path]/route.ts`
- Modify: `apps/web/src/lib/auth/require-user.ts`
- Modify: `apps/web/src/lib/auth/require-user-server.ts`
- Modify: `apps/web/src/proxy.ts`
- Modify: `apps/web/src/app/(auth)/sign-in/actions.ts`
- Modify: `apps/web/src/app/(app)/dashboard/actions.ts`
- Modify: `apps/web/src/app/api/guidance/route.ts`
- Modify: `apps/web/src/app/auth/callback/route.ts`

**Interfaces:**
- Produces `getAuthenticatedUser(): Promise<{ sub: string } | null>` and `requireUser(): Promise<{ sub: string }>`.
- Produces a catch-all Neon Auth route through `auth.handler()`.
- Existing `signIn`, `signUp`, and `signOut` actions retain their present form return shape.

- [ ] **Step 1: Write failing auth tests.** Assert the auth configuration rejects a missing base URL or cookie secret, `getAuthenticatedUser` returns a normalized `{ sub }` from a Neon session, and missing sessions return `null`.
- [ ] **Step 2: Run the focused tests.** Confirm the tests fail because Neon Auth modules do not exist.
- [ ] **Step 3: Implement server configuration.** Create `createNeonAuth({ baseUrl, cookies: { secret } })` using server-only variables. Avoid top-level initialization when required variables are absent until an authenticated route calls the helper.
- [ ] **Step 4: Implement route and proxy boundaries.** Route `/api/auth/[...path]` to `auth.handler()`. Use `auth.middleware({ loginUrl: '/sign-in' })` in `proxy.ts` and preserve static asset exclusions.
- [ ] **Step 5: Convert auth calls.** Replace Supabase password calls with Neon `auth.signIn.email`, `auth.signUp.email`, and `auth.signOut`. Redirect only after a successful sign-in. Preserve generic sign-up response language.
- [ ] **Step 6: Convert server checks.** Make dashboard, session pages, guidance API, and sign-out use `getAuthenticatedUser` or `requireUser`, with API routes returning 401 instead of redirecting.
- [ ] **Step 7: Re-run auth tests, web typecheck, and web lint.** Confirm former Supabase auth imports are absent from runtime files.

### Task 3: Convert the session repository to Neon SQL

**Files:**
- Modify: `apps/web/src/data/sessions/repository.ts`
- Modify: `apps/web/src/data/sessions/repository.test.ts`
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`
- Modify: `apps/web/src/app/(app)/sessions/page.tsx`
- Modify: `apps/web/src/app/(app)/sessions/new/actions.ts`
- Modify: `apps/web/src/app/(app)/sessions/[sessionId]/page.tsx`

**Interfaces:**
- Replaces `SessionDatabaseClient` with `SessionSql`, a minimal tagged-query interface compatible with Neon.
- Preserves `createDraftSession(sql, owner, input)`, `listSessionsForOwner(sql, owner)`, and `getSessionForOwner(sql, owner, sessionId)`.

- [ ] **Step 1: Update repository tests first.** Adapt fixtures to execute captured SQL and assert list, lookup, and insert parameter sets include the owner ID. Keep the cross-owner lookup and malformed UUID cases.
- [ ] **Step 2: Run the repository tests.** Confirm the old Supabase-shaped implementation fails against the tagged-query contract.
- [ ] **Step 3: Implement parameterized queries.** Use SQL tags for insert, ordered list, and owner-scoped lookup. Return only expected `sessions` columns and keep the existing domain mapping and input validation.
- [ ] **Step 4: Connect app pages and actions.** Replace `createClient()` casts with `getNeonSql()`. Add `dynamic = 'force-dynamic'` to server components that query Neon Auth or Postgres.
- [ ] **Step 5: Run web tests, typecheck, lint, and build.** Confirm the dashboard no longer hits the old missing-Supabase configuration error.

### Task 4: Verify the live Neon-backed path and publish

**Files:**
- Modify: `apps/web/.env.example` only if it is absent or does not document non-secret key names.
- Modify only as required by verification fixes.

- [ ] **Step 1: Pull the Vercel development environment.** Run `vercel env pull .env.local --environment=development --yes` in `apps/web`, then verify required names without printing values.
- [ ] **Step 2: Run the real migration command.** Confirm `sessions` exists and has its owner index using a read-only Neon query.
- [ ] **Step 3: Run full verification.** Run web lint, typecheck, tests, build, package formatting, and diff checks. Run a browser smoke test for `/`, `/sign-in`, and unauthenticated `/dashboard`.
- [ ] **Step 4: Publish.** Commit only the migration, runtime code, tests, dependency lockfile, and non-secret documentation. Push `neon-runtime`, open a pull request, verify GitHub Actions, merge after checks, then verify the Vercel production deployment.
