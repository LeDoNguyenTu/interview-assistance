# CandorLens Platform Foundation Implementation Plan

> Required workflow: Read the delivery runbook first, then execute task by task with test-first changes and review checkpoints.

**Goal:** Establish a production-ready monorepo, shared contracts and interface system, authenticated Supabase data layer, deployable web shell, and runnable Tauri desktop shell.

**Architecture:** Turborepo coordinates two apps and four shared packages. Supabase owns authentication, Postgres, realtime publication, and private storage. The foundation exposes a fixture provider and one owner-scoped session vertical slice without live capture or paid-provider traffic.

**Prerequisite:** The planning pull request containing this document is merged. Follow `2026-08-12-candorlens-delivery-runbook.md` throughout.

## Completion boundary

This milestone includes:

- Monorepo and pinned toolchain.
- Shared domain schemas and session state machine.
- Provider-neutral contracts and deterministic fixture implementation.
- Branded shared interface primitives.
- Next.js and Tauri application shells.
- Local Supabase schema, RLS tests, and private storage policies.
- Web authentication and an owner-scoped session list/detail vertical slice.
- Continuous integration and a Vercel preview.

It excludes audio capture, realtime provider connections, transcript ingestion, live guidance, desktop loopback capture, and defense reports.

## Task 1: Establish the isolated branch and pinned monorepo

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.node-version`
- Create: `.npmrc`
- Create: `.editorconfig`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `eslint.config.mjs`
- Create: `tsconfig.base.json`
- Create: `packages/config/package.json`
- Create: `packages/config/eslint/base.mjs`
- Create: `packages/config/typescript/base.json`
- Create: `packages/config/typescript/react.json`
- Create: `packages/config/typescript/nextjs.json`
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `README.md`

**Step 1: Prepare the branch**

Follow the runbook checkout procedure, then create `feature/platform-foundation`. If worktree isolation is desired, obtain approval before creating it.

**Step 2: Add a failing workspace validation**

Create a temporary checklist in the pull request and run:

```powershell
pnpm --version
pnpm turbo run typecheck --dry
```

Expected before setup: pnpm or the workspace command is unavailable.

**Step 3: Add the minimum root configuration**

Pin `packageManager` to `pnpm@11.21.0` and `engines.node` to `>=24 <25`. Pin root development dependencies, including Turborepo 2.10.9, TypeScript 5.9.3, ESLint 10.8.1, and Prettier 3.9.6. Define root scripts for `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`, and `format:check`.

The workspace must include:

```yaml
packages:
  - apps/*
  - packages/*
```

The build graph must make `build`, `lint`, `typecheck`, and `test` depend on upstream package equivalents. Cache build outputs but never cache environment files. Put reusable TypeScript and ESLint settings in `@candorlens/config`; application and package configs extend them instead of copying rules.

**Step 4: Document environment names**

Add every variable from the runbook to `.env.example` with empty values and a public or server-only comment. Do not add real project identifiers or secrets.

**Step 5: Validate and commit**

```powershell
corepack prepare pnpm@11.21.0 --activate
pnpm install
pnpm --version
pnpm format:check
git status --short
```

Expected: pnpm reports `11.21.0`, a lockfile is created, formatting passes, and only intended files are modified.

Commit: `build: configure monorepo toolchain`

## Task 2: Implement the shared domain package

**Files:**

- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/session/schema.ts`
- Create: `packages/core/src/session/events.ts`
- Create: `packages/core/src/session/reducer.ts`
- Create: `packages/core/src/session/reducer.test.ts`
- Create: `packages/core/src/consent/schema.ts`
- Create: `packages/core/src/consent/schema.test.ts`

**Contract:**

```ts
export const sessionModeSchema = z.enum(["coach", "interviewer", "defense"]);
export type SessionMode = z.infer<typeof sessionModeSchema>;

export const sessionStatusSchema = z.enum([
  "draft",
  "ready",
  "capturing",
  "interrupted",
  "processing",
  "completed",
  "failed",
]);

export const captureSourceSchema = z.enum([
  "microphone",
  "browser-tab",
  "system-audio",
  "upload",
]);

export const providerIdSchema = z.enum(["gemini", "openai", "fixture"]);

export interface SessionRecord {
  id: string;
  ownerId: string;
  title: string;
  mode: SessionMode;
  status: SessionStatus;
  providerId: ProviderId;
  captureSources: CaptureSource[];
  consentedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

`SessionEvent` must be a discriminated union covering `PREPARE`, `CONFIRM_CONSENT`, `START_CAPTURE`, `INTERRUPT`, `RESUME`, `STOP_CAPTURE`, `COMPLETE_PROCESSING`, `FAIL`, and `RESET`. `reduceSession` must reject invalid transitions with a typed `SessionTransitionError`.

**Step 1: Write failing reducer tests**

Cover the happy path, start without consent, double start, interruption and resume, stop, provider failure, and reset. Verify exact status and timestamps. Use an injected clock so tests are deterministic.

```powershell
pnpm --filter @candorlens/core test -- reducer.test.ts
```

Expected: failure because the reducer does not exist.

**Step 2: Implement schemas and the minimum reducer**

Use Zod 4.4.3 for external data validation. Keep domain functions side-effect free. Export public contracts only from `src/index.ts`.

**Step 3: Add consent schema tests and implementation**

Define a versioned `ConsentRecord` containing session ID, owner ID, consent version, accepted sources, accepted timestamp, and locale. Reject empty source lists and invalid timestamps.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/core lint
pnpm --filter @candorlens/core typecheck
pnpm --filter @candorlens/core test
```

Commit: `feat(core): add session domain contracts`

## Task 3: Implement provider-neutral model contracts

**Files:**

- Create: `packages/models/package.json`
- Create: `packages/models/tsconfig.json`
- Create: `packages/models/src/index.ts`
- Create: `packages/models/src/contracts/transcription.ts`
- Create: `packages/models/src/contracts/questions.ts`
- Create: `packages/models/src/contracts/guidance.ts`
- Create: `packages/models/src/contracts/errors.ts`
- Create: `packages/models/src/fixture/fixture-provider.ts`
- Create: `packages/models/src/fixture/fixture-provider.test.ts`
- Create: `packages/models/src/contract-tests/guidance-contract.ts`

**Contracts:**

```ts
export interface TranscriptSegment {
  id: string;
  sessionId: string;
  sequence: number;
  speaker: "interviewer" | "interviewee" | "unknown";
  text: string;
  startedAtMs: number;
  endedAtMs: number;
  isFinal: boolean;
  confidence: number | null;
}

export interface DetectedQuestion {
  id: string;
  sessionId: string;
  sourceSegmentIds: string[];
  text: string;
  context: string;
  detectedAtMs: number;
  confidence: number;
}

export interface GuidanceRequest {
  sessionId: string;
  mode: SessionMode;
  question: DetectedQuestion;
  recentTranscript: TranscriptSegment[];
  profileContext: string[];
  signal?: AbortSignal;
}

export interface GuidanceResult {
  requestId: string;
  summary: string;
  talkingPoints: string[];
  cautions: string[];
  followUps: string[];
  providerId: ProviderId;
  model: string;
  usage: { inputTokens: number | null; outputTokens: number | null };
}

export interface GuidanceProvider {
  readonly id: ProviderId;
  generateGuidance(request: GuidanceRequest): Promise<GuidanceResult>;
}

export interface QuestionDetector {
  detect(segments: TranscriptSegment[]): Promise<DetectedQuestion[]>;
}
```

Define a `TranscriptionProvider` contract with `connect`, `sendAudio`, `finish`, `close`, and subscribed typed events for connection state, transcript deltas, final transcript segments, usage, and errors. Do not implement network providers in this milestone.

**Step 1: Write failing fixture and contract tests**

The fixture must return stable results, honor cancellation, reject invalid input, and emit deterministic transcript events. The reusable contract test suite must be callable by future Gemini and OpenAI adapters.

**Step 2: Implement the contracts and fixture**

Normalize provider failures into `ProviderError` with `code`, `providerId`, `retryable`, `operation`, and a safe message. Never carry raw provider payloads into user-visible errors.

**Step 3: Verify and commit**

```powershell
pnpm --filter @candorlens/models lint
pnpm --filter @candorlens/models typecheck
pnpm --filter @candorlens/models test
```

Commit: `feat(models): add provider-neutral contracts`

## Task 4: Build the shared branded interface package

**Files:**

- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/styles/tokens.css`
- Create: `packages/ui/src/lib/cn.ts`
- Create: `packages/ui/src/components/button.tsx`
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/label.tsx`
- Create: `packages/ui/src/components/badge.tsx`
- Create: `packages/ui/src/components/dialog.tsx`
- Create: `packages/ui/src/components/app-shell.tsx`
- Create: `packages/ui/src/components/capture-indicator.tsx`
- Create: `packages/ui/src/components/components.test.tsx`

**Step 1: Write failing accessibility-oriented tests**

Cover keyboard activation, disabled buttons, programmatic labels, dialog focus return, status semantics, and a capture indicator that contains visible text plus an icon.

**Step 2: Implement tokens and primitives**

Translate `docs/brand-guidelines.md` into CSS custom properties. Define approved light and dark semantic tokens, an 8-pixel spacing rhythm, focus rings, reduced-motion behavior, and responsive navigation dimensions. Use Tailwind CSS 4.3.3 with token-backed utilities, Radix Dialog 1.1.23 and Radix Label 2.1.15 for accessible behavior, and source-controlled shared components rather than a runtime component dependency. Use Manrope from a locally packaged font asset or an existing approved repository asset. Use `@phosphor-icons/react` 2.1.10 for icons. Use `clsx` and `tailwind-merge` only in the shared `cn` helper.

`CaptureIndicator` accepts:

```ts
interface CaptureIndicatorProps {
  state: "idle" | "starting" | "capturing" | "interrupted" | "stopping";
  sources: CaptureSource[];
  elapsedSeconds?: number;
  onStop?: () => void;
}
```

The stop control must remain visible while capturing or interrupted.

**Step 3: Verify and commit**

```powershell
pnpm --filter @candorlens/ui lint
pnpm --filter @candorlens/ui typecheck
pnpm --filter @candorlens/ui test
```

Commit: `feat(ui): add branded interface primitives`

## Task 5: Create the Next.js web shell

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/(auth)/sign-in/page.tsx`
- Create: `apps/web/src/app/(app)/layout.tsx`
- Create: `apps/web/src/app/(app)/dashboard/page.tsx`
- Create: `apps/web/src/app/error.tsx`
- Create: `apps/web/src/app/not-found.tsx`
- Create: `apps/web/src/app/page.test.tsx`

**Step 1: Write a failing render test**

Verify the home screen has the CandorLens name, one clear sign-in action, a concise consent-based product statement, and no capture control before authentication.

**Step 2: Implement the shell**

Use App Router and Server Components by default. Keep metadata, page structure, and static copy server rendered. Add Client Components only for actual interaction.

**Step 3: Verify and commit**

```powershell
pnpm --filter @candorlens/web lint
pnpm --filter @candorlens/web typecheck
pnpm --filter @candorlens/web test
pnpm --filter @candorlens/web build
```

Commit: `feat(web): add application shell`

## Task 6: Create the Tauri desktop shell

**Files:**

- Create: `apps/desktop/package.json`
- Create: `apps/desktop/vite.config.ts`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/index.html`
- Create: `apps/desktop/src/main.tsx`
- Create: `apps/desktop/src/app.tsx`
- Create: `apps/desktop/src/app.test.tsx`
- Create: `apps/desktop/src-tauri/Cargo.toml`
- Create: `apps/desktop/src-tauri/build.rs`
- Create: `apps/desktop/src-tauri/tauri.conf.json`
- Create: `apps/desktop/src-tauri/capabilities/default.json`
- Create: `apps/desktop/src-tauri/src/lib.rs`
- Create: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/commands/runtime.rs`

**Step 1: Write failing webview and Rust tests**

The webview test expects the same branded shell and a visible `Capture unavailable` status. The Rust unit test expects `runtime_info` to return application version, operating system, and architecture without exposing environment values.

**Step 2: Implement the minimum shell**

Use shared UI, core, and model packages. Register only the `runtime_info` command. Keep the default Tauri capability file minimal. Do not request microphone, loopback, filesystem, shell, or global shortcut permissions yet.

**Step 3: Verify and commit**

```powershell
pnpm --filter @candorlens/desktop lint
pnpm --filter @candorlens/desktop typecheck
pnpm --filter @candorlens/desktop test
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
pnpm --filter @candorlens/desktop tauri build --debug
```

Commit: `feat(desktop): add Tauri application shell`

## Task 7: Add the local Supabase schema and security tests

**Files:**

- Create: `supabase/config.toml`
- Create: `supabase/migrations/<timestamp>_platform_foundation.sql`
- Create: `supabase/tests/platform_foundation.test.sql`
- Create: `supabase/seed.sql`
- Create: `packages/core/src/database/types.ts`
- Create: `packages/core/src/database/mappers.ts`
- Create: `packages/core/src/database/mappers.test.ts`

Generate the migration timestamp with the pinned Supabase CLI. Do not hand-invent a timestamp.

**Schema:**

Create these owner-scoped tables with UUID primary keys, `user_id uuid not null references auth.users(id) on delete cascade`, `created_at timestamptz not null default now()`, and `updated_at` where records can change:

- `profiles`: display name, locale, default provider, retention days, recording default, and preferences JSON.
- `documents`: private storage path, original filename, media type, byte size, status, extracted text.
- `interview_profiles`: title, target role, company context, instructions, linked document IDs.
- `sessions`: interview profile, mode, status, provider, platform, capture sources, recording flag, title, consent version and timestamp, start/end timestamps.
- `recordings`: session, source, private storage path, media type, byte size, duration, checksum, and upload status.
- `utterances`: session, sequence, speaker, text, start/end milliseconds, final flag, confidence.
- `questions`: session, source utterance IDs, text, context, detected milliseconds, confidence.
- `guidance_events`: session, question, provider, model, structured result JSON, latency, usage counts.
- `reports`: session, report type, status, schema version, structured result JSON.
- `usage_events`: session, provider, operation, model, latency, token counts, audio milliseconds, error category.

Add checks for enums, confidence ranges, non-negative sequence and duration fields, valid consent state, and valid storage sizes. Add indexes beginning with owner and session access paths. Add unique `(session_id, sequence)` for utterances and idempotency keys for guidance and report operations.

Enable RLS on every table. Add explicit authenticated grants and owner policies. Child-table policies must verify ownership through the parent session, not trust a client-supplied user ID alone.

Create private `documents`, `recordings`, and `exports` buckets through supported storage configuration. Object names must begin with the authenticated user ID. Do not enable public read access. Do not modify managed storage table definitions or functions.

**Step 1: Write failing database tests**

Use pgTAP to prove:

- Anonymous users cannot read or write application rows.
- An authenticated owner can create and read valid rows.
- A second user cannot read, update, or delete the owner's rows.
- A second user cannot insert child rows into the owner's session.
- Update checks prevent changing ownership.
- Private document, recording, and export paths reject cross-user access.
- Required constraints and indexes exist.

**Step 2: Apply the migration locally**

```powershell
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm exec supabase db lint --level warning
```

Expected before the migration: database tests fail because the objects do not exist. Expected after implementation: all tests pass and lint reports no warnings introduced by this migration.

**Step 3: Generate types and implement mappers**

Generate TypeScript database types from the local project. Add pure mappers between snake-case rows and domain records. Test null handling, timestamps, enum rejection, and fields cleared to null.

**Step 4: Verify and commit**

Commit: `feat(database): add owner-scoped platform schema`

## Task 8: Add Supabase SSR authentication

**Files:**

- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/supabase/proxy.ts`
- Create: `apps/web/src/proxy.ts`
- Create: `apps/web/src/app/(auth)/sign-in/actions.ts`
- Create: `apps/web/src/app/(auth)/sign-up/page.tsx`
- Create: `apps/web/src/app/auth/callback/route.ts`
- Create: `apps/web/src/app/(app)/dashboard/actions.ts`
- Create: `apps/web/src/components/auth/auth-form.tsx`
- Create: `apps/web/src/lib/auth/require-user.ts`
- Create: `apps/web/src/lib/auth/require-user.test.ts`

**Step 1: Write failing authorization tests**

Verify unauthenticated protected routes redirect to sign-in, signed-in routes receive validated claims, and invalid or missing claims do not fall back to cookie presence.

**Step 2: Implement browser and server clients**

Use `@supabase/ssr`. Refresh auth cookies through `proxy.ts`. Server authorization must validate claims with Supabase and never trust `user_metadata` for access decisions.

**Step 3: Implement sign-in, sign-up, callback, and sign-out**

Return safe form-state errors. Do not disclose whether an email exists. Add accessible status messaging and pending states.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/web test
pnpm --filter @candorlens/web typecheck
pnpm --filter @candorlens/web build
```

Commit: `feat(web): add Supabase authentication`

## Task 9: Complete one owner-scoped session vertical slice

**Files:**

- Create: `apps/web/src/data/sessions/repository.ts`
- Create: `apps/web/src/data/sessions/repository.test.ts`
- Create: `apps/web/src/app/(app)/sessions/page.tsx`
- Create: `apps/web/src/app/(app)/sessions/new/page.tsx`
- Create: `apps/web/src/app/(app)/sessions/new/actions.ts`
- Create: `apps/web/src/app/(app)/sessions/[sessionId]/page.tsx`
- Create: `apps/web/src/components/sessions/session-form.tsx`
- Create: `apps/web/src/components/sessions/session-list.tsx`

**Step 1: Write failing repository tests**

Cover create, list newest first, load by ID, owner scoping, invalid input, and not-found behavior. Use an injected database client in tests.

**Step 2: Implement the repository and pages**

Users can create a draft session with title, mode, and fixture provider, then view only their sessions. The detail page shows status, consent state, selected provider, and a disabled live-start control labeled `Available in the live-session milestone`.

**Step 3: Add an integration test**

Run against local Supabase with two users and prove the second user receives not found for the first user's session.

**Step 4: Verify and commit**

Commit: `feat(web): add session management foundation`

## Task 10: Add continuous integration

**Files:**

- Create: `.github/workflows/quality.yml`
- Create: `.github/workflows/database.yml`
- Create: `.github/workflows/desktop.yml`
- Create: `.github/dependabot.yml`

**Step 1: Add workflows in non-deploying mode**

Pin action versions by reviewed major or commit according to repository policy. Use Node 24 and pnpm 11.21.0. Cache the pnpm store and Turborepo outputs without caching environment files.

`quality.yml` runs install with frozen lockfile, format check, lint, typecheck, unit tests, and build. `database.yml` starts local Supabase and runs reset, pgTAP, and lint. `desktop.yml` runs Rust format check, Clippy with warnings denied, Rust tests, webview tests, and a Windows debug build.

**Step 2: Validate locally**

Run all workflow commands locally. If GitHub-only differences exist, document them in the pull request instead of weakening a gate.

**Step 3: Commit and push**

Commit: `ci: add platform quality gates`

Push and confirm all remote checks pass before the milestone is declared ready.

## Task 11: Link preview services after local gates pass

**Files:**

- Modify: `README.md`
- Modify: `.env.example`
- Do not commit: `.vercel/` project metadata
- Do not commit: `.env.local`, access tokens, provider keys, or Supabase temporary files

**Step 1: Confirm all local gates are green**

Do not continue if any required local command fails.

**Step 2: Link the authorized Supabase project**

Use the pinned CLI. Inspect migration status before pushing. Apply only the additive foundation migration. Run remote database lint and a smoke query using an authenticated test user. Do not reset or repair remote migration history without approval.

**Step 3: Link Vercel and configure environment names**

Link `apps/web`, add the Supabase URL and publishable key to Preview, and deploy a preview. Server provider keys are optional in this milestone because only the fixture provider is active.

**Step 4: Smoke-test the preview**

Verify sign-up or sign-in, create session, list session, view detail, sign out, and cross-user denial. Record the preview URL in the pull request, not in permanent source files.

**Step 5: Commit documentation only if changed**

Commit: `docs: document linked preview setup`

## Task 12: Final foundation verification and handoff

**Files:**

- Modify: Pull-request description and checklist only

**Step 1: Run the full clean verification**

```powershell
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm exec supabase db lint --level warning
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
pnpm --filter @candorlens/desktop tauri build --debug
```

**Step 2: Run manual smoke tests**

Test the local and preview web flows and launch the Windows desktop debug shell. Verify there is no capture permission request or hidden-window behavior.

**Step 3: Scan the diff**

Check for secrets, generated environment files, long-dash punctuation, provider SDK imports outside `packages/models`, broad Tauri capabilities, and missing RLS tests.

**Step 4: Update the pull request and stop**

Include commands and results, preview URL, schema summary, known limitations, and screenshots of the web and desktop shells. Mark the pull request ready for review, then stop. Do not begin the web live-session milestone before approval and merge.
