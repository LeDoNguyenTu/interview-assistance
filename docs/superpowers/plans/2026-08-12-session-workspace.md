# Session Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished, consent-first call-session dashboard and an interactive fixture-backed live workspace for CandorLens.

**Architecture:** Keep the existing owner-scoped session repository as the server boundary. Add a client-side fixture session controller that renders visible state, transcript context, notes, and manual controls without accessing media devices or invoking any model provider. Persist only the current session fields already supported by the database in this milestone.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, `@candorlens/core`, `@candorlens/ui`, Phosphor icons.

## Global Constraints

- Use the approved CandorLens assets and semantic UI tokens, with no copied third-party visual assets or copy.
- Never implement hidden overlays, screen-share filtering, stealth behavior, covert recording, automatic capture, or provider calls.
- Capture controls must visibly state their fixture-only state and require an explicit consent acknowledgement before becoming active.
- Preserve owner scoping via `getSessionForOwner`; unknown and cross-owner session IDs must remain a 404.
- Use 8px spacing rhythm, keyboard-operable controls, visible focus, minimum 44px targets, and reduced-motion-safe transitions.
- New user-facing prose uses normal hyphens only.

---

### Task 1: Define fixture workspace state

**Files:**
- Create: `packages/core/src/session/workspace.ts`
- Create: `packages/core/src/session/workspace.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Produces `WorkspaceState`, `WorkspaceTranscriptItem`, `createFixtureWorkspace(session)`, and `reduceWorkspace(state, event)`.
- Events are `acknowledge-consent`, `start-fixture`, `pause-fixture`, `resume-fixture`, `stop-fixture`, and `add-note`.

- [ ] **Step 1: Write failing reducer tests** for an inactive session, consent gating, capture lifecycle, note creation, and immutable transcript timestamps.
- [ ] **Step 2: Run** `corepack pnpm --filter @candorlens/core test` and confirm the missing workspace module fails.
- [ ] **Step 3: Implement** discriminated event and state types, fixture transcript rows, a consent gate, and a pure reducer that only permits visible fixture states.
- [ ] **Step 4: Re-run** the core tests and `corepack pnpm --filter @candorlens/core typecheck`.
- [ ] **Step 5: Commit** `feat(core): add fixture workspace state`.

### Task 2: Build accessible session workspace components

**Files:**
- Create: `apps/web/src/components/workspace/session-workspace.tsx`
- Create: `apps/web/src/components/workspace/session-workspace.test.tsx`
- Create: `apps/web/src/components/workspace/transcript-timeline.tsx`
- Create: `apps/web/src/components/workspace/context-panel.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes `SessionRecord`, `WorkspaceState`, and the Task 1 reducer.
- Produces `SessionWorkspace({ session })`, with labelled consent checkbox, capture status, transcript list, notes field, and no media-device APIs.

- [ ] **Step 1: Write failing component tests** asserting the start control is disabled until consent, labels and status regions exist, transcript content is rendered, notes add on submit, and reduced-motion CSS is present.
- [ ] **Step 2: Run** `corepack pnpm --filter @candorlens/web test` and confirm the component import fails.
- [ ] **Step 3: Implement** a three-column desktop workspace that stacks on small screens: status/control rail, timeline, and context panel. Use semantic buttons, Phosphor icons, 150-300ms transform/opacity transitions, and an explicit fixture disclaimer.
- [ ] **Step 4: Re-run** web tests, lint, and typecheck.
- [ ] **Step 5: Commit** `feat(web): add live session workspace`.

### Task 3: Replace session detail placeholder and elevate dashboard

**Files:**
- Modify: `apps/web/src/app/(app)/sessions/[sessionId]/page.tsx`
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`
- Modify: `apps/web/src/components/sessions/session-list.tsx`
- Create: `apps/web/src/app/(app)/dashboard/page.test.tsx`

**Interfaces:**
- Consumes `getSessionForOwner`, `SessionWorkspace`, and the existing session list repository.
- Produces a dashboard with session actions and a server-rendered session detail route that mounts the workspace only for an owner-scoped record.

- [ ] **Step 1: Write failing render tests** for dashboard primary action, recent-session empty state, and session detail workspace mounting.
- [ ] **Step 2: Run** the focused test file and confirm it fails against the placeholder UI.
- [ ] **Step 3: Implement** a real-time operations-style dashboard with a concise welcome panel, "New session" primary action, recent sessions, fixture disclosure, and progressive list/card motion. Replace the disabled session-detail button with `SessionWorkspace`.
- [ ] **Step 4: Run** full web tests, lint, typecheck, and production build.
- [ ] **Step 5: Commit** `feat(web): add session dashboard experience`.

### Task 4: Verify the complete milestone and publish

**Files:**
- Modify only as required by verification fixes.

- [ ] **Step 1: Run** `corepack pnpm install --frozen-lockfile`, `corepack pnpm format:check`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, and `corepack pnpm build`.
- [ ] **Step 2: Run** a browser smoke test for `/dashboard`, `/sessions/new`, and a valid owner session using fixture data or documented environment limits.
- [ ] **Step 3: Review** the diff for hidden-capture language, media-device API use, copied brand assets, focus regressions, and long-dash additions.
- [ ] **Step 4: Push** `session-workspace`, open a pull request to `main`, verify GitHub Actions, and merge only after all checks are green.
