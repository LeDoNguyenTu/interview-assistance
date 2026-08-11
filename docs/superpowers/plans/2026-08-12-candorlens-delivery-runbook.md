# CandorLens Delivery Runbook

> Required workflow: Execute one task at a time with test-first changes, review checkpoints, and the guardrails in this document.

**Goal:** Deliver CandorLens as a consent-based interview coaching and interviewer review platform across web and Windows desktop clients.

**Architecture:** A pnpm and Turborepo monorepo contains a Next.js web app, a React and Tauri desktop app, shared UI and domain packages, Supabase services, and provider-neutral Gemini and OpenAI adapters. Each milestone is independently testable and lands through its own pull request.

**Source of truth:** Product behavior comes from `docs/superpowers/specs/2026-08-12-interview-assistance-platform-design.md`. Current visual identity comes from `docs/brand-guidelines.md` and the current brand assets. If the platform spec contains older visual details, the brand guidelines win.

## 1. Non-negotiable product boundary

CandorLens may capture audio only after the signed-in user deliberately starts a session and acknowledges the applicable consent notice.

Every capture surface must provide:

- An explicit source selection step.
- A visible and persistent capture indicator.
- An immediately available stop control.
- A clear explanation of what is being captured and stored.
- Private-by-default storage and owner-scoped access.
- A recoverable interrupted state when capture or networking fails.

The product must never add:

- Screen-share bypass behavior.
- A hidden overlay or a window designed to evade capture.
- Monitoring or proctoring evasion.
- Recording without a visible indicator.
- Protected-content workarounds.
- A feature that presents automated suspicion as a final cheating verdict.

If a proposed implementation conflicts with these rules, stop that task and document the conflict in the pull request. Do not weaken the rule to complete the task.

## 2. Delivery order

Complete and merge the milestones in this order:

1. [Platform foundation](./2026-08-12-platform-foundation.md)
2. [Web live session](./2026-08-12-web-live-session.md)
3. [Windows desktop capture](./2026-08-12-desktop-capture.md)
4. [Interviewer defense analysis](./2026-08-12-defense-analysis.md)

Do not begin the next milestone until the previous pull request is approved and merged. If later work exposes a foundation defect, fix it in a focused `fix/*` branch before continuing.

## 3. Branches, commits, and pull requests

Use these milestone branches:

- `feature/platform-foundation`
- `feature/web-live-session`
- `feature/desktop-capture`
- `feature/defense-analysis`

Use `fix/*`, `design/*`, and `docs/*` for focused follow-up work. Branch names, commit messages, and pull-request text must describe the product change only. Do not include tool, model, or workflow attribution.

Use conventional commits:

- `build: configure monorepo toolchain`
- `feat(core): add session state machine`
- `test(models): cover provider contract failures`
- `fix(web): stop media tracks on capture failure`
- `docs: document local Supabase setup`

Push every completed task or small cohesive task group so GitHub remains the backup. Open each milestone as a draft pull request early, then update it as tasks land. Never force-push a shared branch without explicit approval.

## 4. New-text convention

Use the ASCII hyphen character in all new repository prose and user-facing copy. Do not add Unicode en dash or em dash characters. Historical files do not need bulk rewriting solely for this rule.

Before each commit, scan only new or modified prose:

```powershell
git diff --name-only --diff-filter=ACMR | ForEach-Object {
  if (Test-Path -LiteralPath $_ -PathType Leaf) {
    Select-String -LiteralPath $_ -Pattern '[\u2013\u2014]'
  }
}
```

Expected result: no matches in new or modified text.

## 5. Execution environment

Use the following pinned baseline unless an official compatibility issue is discovered during implementation:

- Node.js 24 LTS
- pnpm 11.21.0 through Corepack
- Turborepo 2.10.9
- Next.js 16.3.0
- React 19.2.8
- TypeScript 5.9.3
- Vite 8.2.1
- Tauri CLI 2.11.4 and API 2.11.1
- Supabase CLI 2.113.0
- Supabase JavaScript 2.112.3
- Supabase SSR 0.12.4
- Vitest 4.1.10
- Playwright 1.62.1
- Zod 4.4.3
- Tailwind CSS 4.3.3
- Phosphor React 2.1.10
- Radix Dialog 1.1.23 and Radix Label 2.1.15
- OpenAI SDK 7.4.0
- Google GenAI SDK 2.16.0

Commit `pnpm-lock.yaml`. Do not use floating package versions in `package.json`.

Before changing code in a new implementation session:

```powershell
git fetch origin --prune
git switch main
git pull --ff-only
git status --short
```

The status must be clean. Create the milestone branch only after updating `main`.

If the current checkout is not isolated, ask for approval before creating a worktree. When approved, first verify that `.worktrees/` is ignored, then create the worktree under that directory. Do not create an unignored worktree inside the repository.

Bootstrap pnpm with:

```powershell
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm --version
```

Expected version: `11.21.0`.

## 6. Test-first task loop

Every behavior change follows this loop:

1. Add the smallest test that expresses the next behavior.
2. Run the focused test and observe the expected failure.
3. Implement the minimum production code needed to pass.
4. Run the focused test again and observe success.
5. Refactor without changing behavior.
6. Run the package-level quality gates.
7. Commit the cohesive change.
8. Push the branch when the task is complete.

Do not write a passing test after the production behavior already exists. Configuration-only tasks may use an explicit validation command instead of a unit test, but the plan must name that command and expected result.

## 7. Shared quality gates

Each milestone must expose these root commands:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Additional gates apply when their surfaces change:

```powershell
pnpm test:e2e
pnpm --filter @candorlens/desktop tauri build --debug
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm exec supabase db lint --level warning
```

Before reporting completion, rerun every applicable command from a clean working tree and capture the result in the pull-request checklist. Never infer success from an earlier partial run.

## 8. Secrets and provider configuration

Only secret names belong in source control. Secret values must stay in ignored local files, Supabase secrets, or Vercel environment variables.

Expected public configuration:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

Expected server-only configuration:

```text
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
OPENAI_TEXT_MODEL
OPENAI_REALTIME_MODEL
GEMINI_API_KEY
GEMINI_TEXT_MODEL
GEMINI_LIVE_MODEL
MODEL_PROVIDER_DEFAULT
PROVIDER_RATE_CARD_JSON
RETENTION_JOB_SECRET
```

Rules:

- Never expose provider API keys or the Supabase service-role key to either client.
- Mint short-lived realtime credentials from authenticated server routes.
- Validate the session owner before minting a credential.
- Apply rate limits and log usage without logging raw audio or secret material.
- Keep model identifiers configurable because provider availability changes.
- Redact tokens, cookies, and authorization headers from test output and logs.

## 9. Supabase rules

Use local Supabase before touching a linked remote project:

```powershell
pnpm exec supabase init
pnpm exec supabase start
pnpm exec supabase db reset
```

Database requirements:

- Store application tables in `public` unless a plan explicitly names another application schema.
- Do not create, alter, or drop objects in the managed `auth`, `storage`, or `realtime` schemas.
- Enable row-level security on every user-owned table.
- Scope policies with `TO authenticated`.
- Use `auth.uid()` and server-validated ownership, never `user_metadata`, for authorization.
- Give update policies both `USING` and `WITH CHECK` clauses.
- Add explicit Data API grants in migrations rather than assuming new tables are exposed.
- Test cross-user denial, anonymous denial, and owner access with database tests.
- Use private storage buckets and owner-scoped object policies.
- Treat destructive remote migration repair, reset, or data deletion as an approval gate.

## 10. Web and Vercel rules

Use Next.js App Router. Prefer Server Components and server actions or route handlers for privileged operations. Add Client Components only where browser APIs, local state, or direct interaction require them.

Do not link or deploy until lint, typecheck, unit tests, and local builds pass. Then use the pinned CLI through the project toolchain:

```powershell
pnpm dlx vercel@58.9.3 link
pnpm dlx vercel@58.9.3 env pull apps/web/.env.local
pnpm dlx vercel@58.9.3 deploy
```

The first deployment is a preview. Production promotion requires explicit approval. Do not print pulled environment values in logs or pull-request text.

## 11. Provider integration rules

All model-specific behavior must sit behind contracts in `packages/models`. UI and domain code must not import provider SDKs directly.

Use direct provider SDKs for the initial release:

- OpenAI Responses for text and structured guidance.
- OpenAI Realtime for live transcription when selected.
- Gemini text generation for structured guidance.
- Gemini Live for live transcription when selected.
- A deterministic fixture provider for unit, integration, and end-to-end tests.

Provider integrations must support timeout, cancellation, retry classification, usage reporting, schema validation, and safe user-facing errors. Live paid-provider tests must be opt-in and must never run on pull requests by default.

At the start of each provider task, check the current official documentation for supported model identifiers, audio formats, session limits, event names, and credential flow. Update configuration and tests if the official contract has changed.

## 12. Accessibility and interface quality

Every interactive flow must be keyboard usable and provide visible focus states. Use semantic elements, programmatic labels, and polite live regions for transcript and connection updates. Respect reduced motion. Maintain at least WCAG AA color contrast.

The capture indicator must not rely on color alone. The stop action must be reachable without opening a menu. Error messages must explain recovery in plain language.

Use the current CandorLens brand tokens, Manrope typography, and Phosphor icons. Avoid decorative icons when text is clearer. Do not use emoji as interface icons.

## 13. Observability and privacy

Create one request or event identifier per provider operation. Log only operational metadata needed to debug failures:

- Event identifier
- Owner identifier or a one-way internal reference
- Session identifier
- Provider identifier
- Operation type
- Latency
- Token or audio duration usage
- Error category

Do not log transcript text, resume content, raw audio, API keys, cookies, or access tokens. Usage records must be owner scoped.

## 14. Approval gates

Stop and request explicit approval before:

- Creating or changing a production deployment.
- Enabling paid provider traffic beyond an explicitly approved smoke test.
- Applying a destructive remote database operation.
- Publishing a signed desktop release.
- Adding any capability outside the product boundary in section 1.
- Merging a milestone pull request.

Routine local development, automated tests, preview deployments, and non-destructive migrations remain within the approved implementation scope once execution begins.

## 15. Definition of done for each milestone

A milestone is complete only when:

- Every plan task is checked off with its commit.
- Applicable quality gates pass from a clean checkout.
- Safety invariants have automated coverage where practical.
- New environment variables appear in `.env.example` without values.
- User-facing setup and recovery behavior is documented.
- The draft pull request contains test evidence and known limitations.
- A manual smoke test covers the milestone's critical path.
- No new Unicode en dash or em dash is present in modified prose.
- No secrets or generated local environment files are committed.

## 16. Handoff procedure

The implementation session should begin by reading this runbook and only the next milestone plan. Execute the platform foundation plan first. When that pull request is ready, stop for review. Continue with the next plan only after the prior pull request is merged.

Do not scaffold applications, install dependencies, link cloud projects, run migrations, or start implementation while this planning pull request is still under review.

## 17. Official references to refresh during implementation

- Next.js installation: <https://nextjs.org/docs/app/getting-started/installation>
- Supabase SSR client setup: <https://supabase.com/docs/guides/auth/server-side/creating-a-client>
- Supabase local development: <https://supabase.com/docs/guides/local-development/cli/getting-started>
- Tauri project creation: <https://v2.tauri.app/start/create-project/>
- Tauri Windows prerequisites: <https://v2.tauri.app/start/prerequisites/>
- Windows loopback recording: <https://learn.microsoft.com/en-us/windows/win32/coreaudio/loopback-recording>
- Gemini Live start guide: <https://ai.google.dev/gemini-api/docs/live-api/get-started-sdk>
- Gemini Live ephemeral tokens: <https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens>
- OpenAI Realtime API: <https://platform.openai.com/docs/api-reference/realtime>
- OpenAI Responses streaming events: <https://platform.openai.com/docs/api-reference/responses-streaming/response/refusal/delta>
