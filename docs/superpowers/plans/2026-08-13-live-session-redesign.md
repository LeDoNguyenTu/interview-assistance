# CandorLens Live Session Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a cohesive authenticated visual system and a visible, consented browser live-session workflow that can run in deterministic fixture mode without a provider key.

**Architecture:** Server-rendered application routes retain Neon owner scoping. Client-only modules own browser capabilities and acquired media tracks. A provider configuration boundary exposes only availability metadata to the browser, and the workspace uses fixture transcription until a server provider is configured.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Geist, Vitest, Testing Library, Neon Auth, Neon Postgres, `@candorlens/core`, and `@candorlens/models`.

## Global Constraints

- Use `D:\PROJECTS\InterviewAssistance` as the user-facing working checkout and do not create a second project folder.
- Push once after local verification to minimize GitHub Actions consumption. Do not open a pull request for intermediate commits.
- Use the page override in `design-system/candorlens/pages/app-workspace.md` over generated master typography guidance.
- Use Geist Sans for UI and Geist Mono for compact technical metadata. New prose uses normal hyphens only.
- Never implement hidden capture, screen-share bypass, content exclusion, covert recording, automatic capture, hiring decisions, or automatic cheating verdicts.
- Every capture path requires explicit consent acknowledgement before browser permissions are requested, shows persistent capture state, and stops all tracks on stop or disposal.
- Provider keys and model IDs remain server-only. OpenAI and Gemini providers can be shown as unavailable without a key.

---

### Task 1: Establish the signed-in visual system

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `packages/ui/src/styles/tokens.css`
- Modify: `apps/web/src/app/(app)/layout.tsx`
- Test: `apps/web/src/app/layout.test.tsx`

**Interfaces:**
- Produces global CSS variables `--cl-font-sans`, `--cl-font-mono`, dark semantic surface tokens, and the `AppChrome` navigation shell.
- Consumes existing Next App Router layout and CandorLens logo asset.

- [ ] **Step 1: Write a failing layout test** that renders the root and authenticated layout and asserts a `main` landmark, accessible navigation labels, dark application shell class, and Geist font variables.
- [ ] **Step 2: Run the focused test** with `corepack pnpm --filter @candorlens/web test -- layout.test.tsx` and confirm it fails because the required shell semantics and font variables are absent.
- [ ] **Step 3: Implement the narrowest shared system** by adding `geist`, importing `GeistSans` and `GeistMono` through `geist/font/sans` and `geist/font/mono`, applying their variables at `<html>`, and defining dark semantic tokens with white primary-button foregrounds.
- [ ] **Step 4: Add the authenticated shell** with Dashboard, Sessions, and Settings navigation, a visible active state, and account sign-out access. Preserve server rendering outside the small responsive navigation client boundary.
- [ ] **Step 5: Re-run the focused test, web lint, and web typecheck. Commit** `feat(web): unify signed-in visual system`.

### Task 2: Make session records provider-aware without exposing keys

**Files:**
- Create: `apps/web/src/config/providers.ts`
- Create: `apps/web/src/config/providers.test.ts`
- Modify: `apps/web/src/data/sessions/repository.ts`
- Modify: `apps/web/src/data/sessions/repository.test.ts`
- Modify: `apps/web/src/components/sessions/session-form.tsx`
- Modify: `apps/web/src/app/(app)/sessions/new/actions.ts`
- Modify: `apps/web/src/app/(app)/sessions/new/page.tsx`

**Interfaces:**
- Produces `getProviderAvailability(env)` returning `{ id, label, available, reason }[]` without keys or models.
- Extends `createDraftSession` input to accept `providerId: 'fixture' | 'openai' | 'gemini'` only when the selected provider is available.
- Consumes Neon SQL through the existing `SessionSql` type.

- [ ] **Step 1: Write failing tests** for unavailable server keys, absent public key leaks, fixture availability, OpenAI draft creation when configured, and rejection of a provider selection when unavailable.
- [ ] **Step 2: Run** `corepack pnpm --filter @candorlens/web test -- providers.test.ts repository.test.ts` and confirm failures are caused by missing provider configuration and fixture-only validation.
- [ ] **Step 3: Implement server-only provider availability** from `OPENAI_API_KEY` plus `OPENAI_TEXT_MODEL` and `GEMINI_API_KEY` plus `GEMINI_TEXT_MODEL`; return generic configuration guidance only.
- [ ] **Step 4: Update the session creation form** to use a clear provider selection with unavailable providers disabled and explained. Keep fixture mode visible for local demonstration.
- [ ] **Step 5: Re-run focused tests, lint, and typecheck. Commit** `feat(web): add session provider selection`.

### Task 3: Add testable browser capability and consent state

**Files:**
- Create: `apps/web/src/features/capture/browser-capabilities.ts`
- Create: `apps/web/src/features/capture/browser-capabilities.test.ts`
- Create: `apps/web/src/features/capture/consent-machine.ts`
- Create: `apps/web/src/features/capture/consent-machine.test.ts`
- Create: `apps/web/src/features/capture/components/source-picker.tsx`
- Create: `apps/web/src/features/capture/components/consent-panel.tsx`
- Create: `apps/web/src/features/capture/components/consent-panel.test.tsx`

**Interfaces:**
- Produces `detectBrowserCaptureCapabilities(windowLike)`, `CaptureSelection`, and `reduceCaptureConsent(state, event)`.
- `CaptureSelection` has `{ microphone: boolean; displayAudio: boolean }` and rejects an empty selection.
- Consent states are `selecting`, `explaining`, `confirmed`, `requesting`, `ready`, `cancelled`, and `failed`.

- [ ] **Step 1: Write failing pure and component tests** for an insecure context, absent media APIs, microphone-only selection, display-only selection, empty selection, consent mismatch, cancellation, visible consent copy, and disabled confirmation controls.
- [ ] **Step 2: Run** `corepack pnpm --filter @candorlens/web test -- browser-capabilities.test.ts consent-machine.test.ts consent-panel.test.tsx` and confirm missing-module failures.
- [ ] **Step 3: Implement pure capability detection and the state reducer.** The reducer permits permission requests only after acknowledgement and a nonempty source selection.
- [ ] **Step 4: Implement source and consent controls** with native inputs, source-specific explanatory copy, `role="status"`, clear error recovery, 44px controls, and no language promising display-audio availability.
- [ ] **Step 5: Re-run the focused tests, lint, and typecheck. Commit** `feat(web): add visible capture consent flow`.

### Task 4: Build the fail-closed browser capture controller

**Files:**
- Create: `apps/web/src/features/capture/browser-capture-controller.ts`
- Create: `apps/web/src/features/capture/browser-capture-controller.test.ts`
- Create: `apps/web/src/features/capture/audio-level.ts`
- Create: `apps/web/src/features/capture/audio-level.test.ts`

**Interfaces:**
- Produces `BrowserCaptureController` with `prepare(selection)`, `start()`, `stop(reason)`, `dispose()`, `subscribe(listener)`, and `snapshot()`.
- Snapshot has status, active sources, duration start time, browser display audio availability, and a safe error code.
- Consumes an injectable media adapter around `navigator.mediaDevices` so tests never ask for a real permission.

- [ ] **Step 1: Write failing tests** that assert microphone tracks stop on user stop, display tracks stop when the browser ends sharing, partial startup failure stops every acquired track, empty selection never opens media APIs, and stop is idempotent.
- [ ] **Step 2: Run** `corepack pnpm --filter @candorlens/web test -- browser-capture-controller.test.ts audio-level.test.ts` and confirm the controller module is absent.
- [ ] **Step 3: Implement the controller** using user-triggered `getUserMedia` and `getDisplayMedia({ audio: true, video: true })`. It records actual audio-track availability after chooser selection, invokes listeners synchronously, and tears down all tracks plus listeners on every terminal path.
- [ ] **Step 4: Implement a bounded pure audio-level calculator** used only for the visible source meter. It receives normalised byte or float samples and emits zero for silence.
- [ ] **Step 5: Re-run focused tests, lint, and typecheck. Commit** `feat(web): add browser capture controller`.

### Task 5: Replace the fixture workspace with the live-session screen

**Files:**
- Create: `apps/web/src/features/live-session/live-session-machine.ts`
- Create: `apps/web/src/features/live-session/live-session-machine.test.ts`
- Create: `apps/web/src/features/live-session/components/live-session-screen.tsx`
- Create: `apps/web/src/features/live-session/components/live-session-screen.test.tsx`
- Modify: `apps/web/src/components/workspace/session-workspace.tsx`
- Modify: `apps/web/src/app/(app)/sessions/[sessionId]/page.tsx`
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`
- Modify: `apps/web/src/app/(app)/sessions/page.tsx`
- Modify: `apps/web/src/components/sessions/session-list.tsx`

**Interfaces:**
- Produces `createLiveSessionState(session)` and `reduceLiveSession(state, event)`.
- The screen consumes `SessionRecord`, provider availability, `BrowserCaptureController`, and the fixture transcript provider.
- The visible state includes capture status, start and stop controls, source status, transcript, current question, notes, provider availability, and distinct unavailable or permission-error UI.

- [ ] **Step 1: Write failing state and screen tests** for consent gating, active capture indicator, immediate stop, permission denial, display source with no audio, a fixture transcript item, provider-unavailable state, and an accessible session status announcement.
- [ ] **Step 2: Run** `corepack pnpm --filter @candorlens/web test -- live-session-machine.test.ts live-session-screen.test.tsx` and confirm expected missing-module failures.
- [ ] **Step 3: Implement the state machine and fixture path** so fixture mode gives deterministic incremental transcript and question output without a network call. Keep the capture controller separately injected so physical media capture is never faked.
- [ ] **Step 4: Implement the three-panel dark workspace**: live signal and capture control, transcript/current question, and notes/provider guidance. Use visible source chips, mono elapsed time, numeric status labels, and a high-contrast danger stop action.
- [ ] **Step 5: Rebuild sessions and dashboard views** as consistent dark app pages, preserving owner-scoped routes and showing real zero states instead of empty decorative panels.
- [ ] **Step 6: Re-run focused tests, full web tests, lint, typecheck, and production build. Commit** `feat(web): deliver visible live-session workspace`.

### Task 6: Validate locally and integrate with one remote trigger

**Files:**
- Modify only verification fixes and documentation required by the preceding tasks.

- [ ] **Step 1: Run local verification**: `corepack pnpm format:check`, `corepack pnpm --filter @candorlens/web lint`, `corepack pnpm --filter @candorlens/web typecheck`, `corepack pnpm --filter @candorlens/web test`, and `corepack pnpm --filter @candorlens/web build`.
- [ ] **Step 2: Run a local browser smoke** for sign-in redirection, dashboard, new-session form, and a session detail fixture. Verify desktop and 375px layouts, keyboard flow, visible contrast, and reduced-motion CSS.
- [ ] **Step 3: Review the diff** for provider-key exposure, media capture before consent, missing track cleanup, weak button contrast, long-dash additions, and stealth behavior.
- [ ] **Step 4: Commit all validated changes, fast-forward `main` locally, and perform one push.** This creates one main-branch quality run rather than a pull-request run plus a main-branch run.

## Follow-on plans

The existing `2026-08-12-web-live-session.md` is superseded where it names Supabase. The next focused plans should cover: realtime provider credentials and transcription after a key is supplied, owner-scoped transcript persistence on Neon, private document and recording storage selected for the Neon architecture, desktop capture, and interviewer defense analysis.
