# Guidance Providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-triggered OpenAI and Gemini guidance generation to the visible CandorLens workspace without exposing provider keys or automating interview decisions.

**Architecture:** A server-only dispatcher validates a constrained guidance input and calls the selected text-generation endpoint with an injected `fetch` implementation for testability. An authenticated Next.js route accepts only visible transcript and note data, maps provider failures to safe client messages, and returns a short human-review draft. The client sends nothing until the user presses the action.

**Tech Stack:** Next.js 16 Route Handlers, TypeScript, native `fetch`, React 19, Vitest, Testing Library, `@candorlens/core`.

## Global Constraints

- API keys are server-only `OPENAI_API_KEY` and `GEMINI_API_KEY` environment variables and must never be returned or logged.
- Requests are user-triggered and visible. Do not add background prompts, automatic question detection, capture APIs, stealth behavior, or final hiring recommendations.
- Restrict submitted data to 12 transcript items, 12 notes, and 12,000 total characters. Validate provider, mode, and all strings before outbound calls.
- Provider responses must be labelled as draft guidance for human review and must not recommend a hire/no-hire outcome.
- Do not persist transcript or provider responses in this milestone.

---

### Task 1: Implement server-only provider dispatcher

**Files:**
- Create: `apps/web/src/lib/guidance/dispatcher.ts`
- Create: `apps/web/src/lib/guidance/dispatcher.test.ts`

- [ ] Write failing tests for missing configuration, OpenAI response extraction, Gemini response extraction, safe error mapping, and validation limits.
- [ ] Run the focused test and verify the missing dispatcher module fails.
- [ ] Implement `generateGuidance(input, dependencies)` with injected fetch, provider-specific request builders, bounded input validation, and safe error classes.
- [ ] Run focused tests, web lint, and typecheck.
- [ ] Commit `feat(web): add server guidance dispatcher`.

### Task 2: Add authenticated guidance route

**Files:**
- Create: `apps/web/src/app/api/guidance/route.ts`
- Create: `apps/web/src/app/api/guidance/route.test.ts`

- [ ] Write failing route tests for unauthenticated requests, invalid JSON, successful dispatcher output, and safe error status mapping.
- [ ] Run the focused test and verify it fails because the route is missing.
- [ ] Implement `POST` using `requireUser`, no-cache JSON headers, and the dispatcher. Do not accept owner IDs or API keys from the client.
- [ ] Run route tests, web lint, typecheck, and build.
- [ ] Commit `feat(web): add guidance route`.

### Task 3: Wire visible workspace guidance

**Files:**
- Modify: `apps/web/src/components/workspace/session-workspace.tsx`
- Modify: `apps/web/src/components/workspace/session-workspace.test.tsx`

- [ ] Write a failing client test that proves no request occurs before the visible button is pressed and that a returned draft is labelled for human review.
- [ ] Implement a provider selector, loading state, error recovery, and a labelled guidance card. Submit only the displayed fixture transcript and locally added notes.
- [ ] Run full web tests, lint, typecheck, production build, and diff checks.
- [ ] Commit `feat(web): add manual guidance panel`.

### Task 4: Publish and verify

- [ ] Run frozen install, direct package verification gates, formatting check, and no-capture/no-stealth source scan.
- [ ] Push `guidance-providers`, open a pull request to `main`, monitor CI, and merge only when clean.
