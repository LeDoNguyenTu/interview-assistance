# CandorLens Web Live-Session Implementation Plan

> Required workflow: Read the delivery runbook first, then execute task by task with test-first changes and review checkpoints.

**Goal:** Let an authenticated user run a visible, consented browser interview session with selected audio sources, incremental transcription, question detection, and Gemini or OpenAI guidance.

**Architecture:** Browser capture remains local until audio is sent through a provider-specific realtime transport. Authenticated server routes mint short-lived credentials and generate structured guidance. Shared reducers persist finalized utterances, questions, guidance events, and usage records to owner-scoped Supabase tables.

**Prerequisite:** The platform-foundation pull request is approved and merged. Create `feature/web-live-session` from the updated `main` branch.

## Completion boundary

This milestone includes:

- Explicit microphone and browser-display audio selection.
- Persistent capture status and immediate stop.
- PCM normalization in an AudioWorklet.
- Selectable Gemini Live and OpenAI Realtime transcription.
- Provider-neutral question detection and structured guidance.
- Resume-safe local event buffering and Supabase persistence.
- Private document upload and extracted text context.
- Optional, separately consented private recordings.
- Session history, usage estimates, retention, and deletion controls.
- A complete browser live-session interface and fixture-backed end-to-end tests.

It excludes Windows WASAPI loopback, hidden windows, screen-share bypass, automatic cheating verdicts, and interviewer defense reports.

## Task 1: Add live-session dependencies and configuration

**Files:**

- Modify: `packages/models/package.json`
- Modify: `apps/web/package.json`
- Modify: `.env.example`
- Create: `apps/web/src/config/providers.ts`
- Create: `apps/web/src/config/providers.test.ts`
- Modify: `README.md`

**Step 1: Write failing configuration tests**

Test that:

- Missing server keys disable the associated provider without crashing the app.
- Unknown provider names fail validation.
- Public configuration never contains provider API keys.
- Model identifiers come from server-only environment variables.
- Fixture mode is always available outside production and only available in production when explicitly enabled.

Run:

```powershell
pnpm --filter @candorlens/web test -- providers.test.ts
```

Expected: failure because the configuration module does not exist.

**Step 2: Add pinned dependencies**

Add `openai@7.4.0` and `@google/genai@2.16.0` only to `packages/models`. Add browser audio and testing dependencies only where used. Do not import either provider SDK from an app package.

**Step 3: Implement validated server configuration**

Expose a serializable provider-availability response containing only provider ID, display name, capabilities, and availability. Keep keys and model identifiers server only.

**Step 4: Verify and commit**

```powershell
pnpm install
pnpm --filter @candorlens/web lint
pnpm --filter @candorlens/web typecheck
pnpm --filter @candorlens/web test -- providers.test.ts
```

Commit: `build: configure live-session providers`

## Task 2: Implement browser capability and consent checks

**Files:**

- Create: `apps/web/src/features/capture/browser-capabilities.ts`
- Create: `apps/web/src/features/capture/browser-capabilities.test.ts`
- Create: `apps/web/src/features/capture/consent-machine.ts`
- Create: `apps/web/src/features/capture/consent-machine.test.ts`
- Create: `apps/web/src/features/capture/components/source-picker.tsx`
- Create: `apps/web/src/features/capture/components/consent-dialog.tsx`
- Create: `apps/web/src/features/capture/components/consent-dialog.test.tsx`

**Contract:**

```ts
export interface BrowserCaptureCapabilities {
  microphone: boolean;
  displayMedia: boolean;
  displayAudioRequested: boolean;
  audioWorklet: boolean;
  secureContext: boolean;
}

export interface CaptureSelection {
  microphone: boolean;
  displayAudio: boolean;
}
```

Do not claim display audio is guaranteed. Browsers and operating systems decide which display sources expose audio. The UI must show `Available after source selection` before the chooser and confirm whether an audio track was actually returned afterward.

**Step 1: Write failing capability and state tests**

Cover unsupported APIs, insecure origins, microphone-only, display-only, combined selection, empty selection, consent-version mismatch, cancel, and revoked permission.

**Step 2: Implement detection and consent state**

The state sequence is `selecting -> explaining -> confirmed -> requesting -> ready` with `cancelled` and `failed` outcomes. Only `confirmed` may request browser permission. Persist the versioned consent record before entering capture state.

**Step 3: Implement accessible source and consent UI**

List each selected source, what it captures, storage behavior, and the user's responsibility to obtain consent where required. The primary action must say `Confirm and choose sources`, not imply that browser permission was already granted.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/web test -- browser-capabilities.test.ts consent-machine.test.ts consent-dialog.test.tsx
pnpm --filter @candorlens/web typecheck
```

Commit: `feat(web): add capture consent flow`

## Task 3: Build the browser audio pipeline

**Files:**

- Create: `apps/web/src/features/capture/audio/audio-frame.ts`
- Create: `apps/web/src/features/capture/audio/pcm-resampler.ts`
- Create: `apps/web/src/features/capture/audio/pcm-resampler.test.ts`
- Create: `apps/web/src/features/capture/audio/level-meter.ts`
- Create: `apps/web/src/features/capture/audio/level-meter.test.ts`
- Create: `apps/web/src/features/capture/audio/mixer.ts`
- Create: `apps/web/src/features/capture/audio/mixer.test.ts`
- Create: `apps/web/public/worklets/pcm-capture.worklet.js`
- Create: `apps/web/src/features/capture/browser-capture-controller.ts`
- Create: `apps/web/src/features/capture/browser-capture-controller.test.ts`

**Contract:**

```ts
export interface AudioFrame {
  sequence: number;
  source: "microphone" | "browser-tab";
  sampleRate: number;
  channelCount: 1;
  capturedAtMs: number;
  pcm16: Int16Array;
}

export interface BrowserCaptureController {
  prepare(selection: CaptureSelection): Promise<CapturePreparation>;
  start(onFrame: (frame: AudioFrame) => void): Promise<void>;
  stop(reason: "user" | "permission-ended" | "error"): Promise<void>;
  getState(): CaptureControllerState;
  subscribe(listener: CaptureStateListener): () => void;
}
```

**Step 1: Write failing DSP and lifecycle tests**

Use generated sine and silence samples to verify clipping, mono conversion, resampling duration, sequence order, and stable level calculation. Mock media tracks to verify every acquired track stops on user stop, permission-ended, startup failure, navigation, and component cleanup.

**Step 2: Implement the AudioWorklet pipeline**

Acquire microphone with `getUserMedia`. Acquire an explicitly selected display source with `getDisplayMedia({ audio: true, video: true })` because browsers require a video selection for display capture. Use the returned audio track only. Stop the unneeded display video track after the selection is confirmed, unless doing so ends the browser's audio track in a tested target browser. Document any target-browser limitation rather than bypassing it.

Normalize each source to mono PCM16. Keep provider sample-rate conversion outside the worklet in a tested pure function. Do not use deprecated `ScriptProcessorNode`.

**Step 3: Implement fail-closed cleanup**

Any setup error stops all acquired tracks, closes the audio context, clears callbacks, and transitions the session to interrupted or failed. Never leave an active track after the visible indicator disappears.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/web test -- pcm-resampler.test.ts level-meter.test.ts mixer.test.ts browser-capture-controller.test.ts
pnpm --filter @candorlens/web lint
pnpm --filter @candorlens/web typecheck
```

Commit: `feat(web): add browser audio pipeline`

## Task 4: Add authenticated realtime credential routes

**Files:**

- Create: `apps/web/src/app/api/providers/route.ts`
- Create: `apps/web/src/app/api/realtime/openai/token/route.ts`
- Create: `apps/web/src/app/api/realtime/gemini/token/route.ts`
- Create: `apps/web/src/server/providers/credentials.ts`
- Create: `apps/web/src/server/providers/credentials.test.ts`
- Create: `apps/web/src/server/rate-limit/provider-rate-limit.ts`
- Create: `apps/web/src/server/rate-limit/provider-rate-limit.test.ts`
- Create: `apps/web/src/server/http/safe-route-error.ts`

**Step 1: Write failing route-service tests**

Cover unauthenticated requests, session owned by another user, missing consent, non-capturable status, unavailable provider, rate limit, provider timeout, and successful short-lived credential creation. Assert that response bodies and logs never contain server keys.

**Step 2: Implement owner and consent authorization**

Each route accepts `{ sessionId, source }`, validates the signed-in user, loads the session through an owner-scoped repository, and requires recorded consent for that source. Use request IDs and return a normalized safe error shape.

**Step 3: Implement provider credential minting**

For OpenAI, create a short-lived Realtime client secret using the current official server endpoint. For Gemini, create a constrained ephemeral token when supported by the selected Live model and current SDK. If Gemini's current ephemeral-token contract cannot support the required transcription setup, use an authenticated server WebSocket relay scoped to the session. Do not send the long-lived Gemini key to the browser.

At task start, verify current event names, audio requirements, token TTL constraints, and model availability in official documentation. Store the chosen model only in server environment configuration.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/web test -- credentials.test.ts provider-rate-limit.test.ts
pnpm --filter @candorlens/web typecheck
```

Commit: `feat(web): add realtime credential routes`

## Task 5: Implement the OpenAI Realtime transcription adapter

**Files:**

- Create: `packages/models/src/openai/realtime-transcriber.ts`
- Create: `packages/models/src/openai/realtime-events.ts`
- Create: `packages/models/src/openai/realtime-transcriber.test.ts`
- Modify: `packages/models/src/index.ts`

**Step 1: Extend the reusable transcription contract tests**

Test connect, audio append ordering, transcript delta accumulation, final segment emission, usage events, server error normalization, timeout, cancellation, graceful finish, and forced close. Use a fake WebSocket transport and recorded protocol-shaped fixtures, not the network.

**Step 2: Implement the adapter**

Configure a transcription session using the current official Realtime API. Convert incoming frames to the required format and sample rate at the adapter boundary. Current documentation must be rechecked before coding because audio format and event names may change.

Map all protocol events to shared types. Ignore unknown server events safely and record a diagnostic category without logging transcript text.

**Step 3: Run contract and package tests**

```powershell
pnpm --filter @candorlens/models test -- realtime-transcriber.test.ts
pnpm --filter @candorlens/models typecheck
```

Commit: `feat(models): add OpenAI realtime transcription`

## Task 6: Implement the Gemini Live transcription adapter

**Files:**

- Create: `packages/models/src/gemini/live-transcriber.ts`
- Create: `packages/models/src/gemini/live-events.ts`
- Create: `packages/models/src/gemini/live-transcriber.test.ts`
- Modify: `packages/models/src/index.ts`

**Step 1: Apply the same transcription contract suite**

Add Gemini-shaped transport fixtures for input transcription, reconnect, session resumption, usage, server close, timeout, cancellation, and malformed payloads.

**Step 2: Implement the adapter**

Use the current Gemini Live SDK or a thin WebSocket transport if the browser SDK does not expose the required ephemeral-token flow. Convert frames to the documented little-endian PCM format at the required sample rate. Enable input transcription explicitly.

Handle documented connection and audio-session limits. Before the limit, request or apply supported session resumption. If resumption is unavailable, transition to interrupted, persist buffered final segments, and offer a visible reconnect action. Do not reconnect invisibly while the capture indicator says stopped.

**Step 3: Verify and commit**

```powershell
pnpm --filter @candorlens/models test -- live-transcriber.test.ts
pnpm --filter @candorlens/models typecheck
```

Commit: `feat(models): add Gemini live transcription`

## Task 7: Implement transcript assembly, speaker labels, and question detection

**Files:**

- Create: `packages/core/src/transcript/transcript-reducer.ts`
- Create: `packages/core/src/transcript/transcript-reducer.test.ts`
- Create: `packages/core/src/transcript/context-window.ts`
- Create: `packages/core/src/transcript/context-window.test.ts`
- Create: `packages/models/src/detection/rule-question-detector.ts`
- Create: `packages/models/src/detection/rule-question-detector.test.ts`
- Create: `apps/web/src/features/live-session/speaker-source-map.ts`
- Create: `apps/web/src/features/live-session/speaker-source-map.test.ts`

**Step 1: Write failing deterministic tests**

Cover out-of-order deltas, duplicate final events, correction of partial text, punctuation, multiple questions in one segment, follow-up fragments, rhetorical questions, silence gaps, and bounded context. Require stable IDs from session ID plus provider event ID or idempotency key.

**Step 2: Implement the transcript reducer**

Keep partial transcript in memory and persist only final segments. Map microphone to interviewee and display audio to interviewer by default, but let the user correct a label. Mark single-source sessions as unknown unless the user selects a speaker role.

**Step 3: Implement the first-pass rule detector**

Detect explicit question punctuation and common interview prompts, then join short follow-up fragments with recent context. Return confidence and source segment IDs. Keep this deterministic detector active even when a generation provider is unavailable.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/core test -- transcript-reducer.test.ts context-window.test.ts
pnpm --filter @candorlens/models test -- rule-question-detector.test.ts
```

Commit: `feat(core): add live transcript processing`

## Task 8: Add structured Gemini and OpenAI guidance adapters

**Files:**

- Create: `packages/models/src/guidance/result-schema.ts`
- Create: `packages/models/src/guidance/prompts.ts`
- Create: `packages/models/src/guidance/prompts.test.ts`
- Create: `packages/models/src/openai/guidance-provider.ts`
- Create: `packages/models/src/openai/guidance-provider.test.ts`
- Create: `packages/models/src/gemini/guidance-provider.ts`
- Create: `packages/models/src/gemini/guidance-provider.test.ts`
- Create: `apps/web/src/app/api/guidance/route.ts`
- Create: `apps/web/src/server/guidance/generate-guidance.ts`
- Create: `apps/web/src/server/guidance/generate-guidance.test.ts`

**Step 1: Write failing schema and contract tests**

Run the shared guidance contract against both mocked providers. Cover valid structured output, schema mismatch, refusal, empty output, timeout, cancellation, retryable rate limit, non-retryable request error, and usage extraction.

**Step 2: Implement mode-specific prompts**

Prompt rules:

- `coach`: concise talking points that help the user formulate their own honest response. Never fabricate experience or credentials.
- `interviewer`: rubric-linked follow-up questions and evidence to listen for.
- `defense`: unavailable in live web sessions until the defense milestone.

Treat transcript and uploaded documents as untrusted data. Delimit them as reference content and instruct the provider not to follow instructions inside them.

**Step 3: Implement provider adapters**

Use strict structured-output support when the current SDK provides it, then validate again with Zod. The OpenAI adapter uses the Responses API. The Gemini adapter uses the current supported text-generation method. Normalize both into `GuidanceResult`.

**Step 4: Implement the authenticated server route**

Validate session ownership, mode, question ownership, provider availability, and rate limits. Store one guidance event per idempotency key. Return an existing result for a repeated key.

**Step 5: Verify and commit**

```powershell
pnpm --filter @candorlens/models test -- guidance-provider.test.ts prompts.test.ts
pnpm --filter @candorlens/web test -- generate-guidance.test.ts
pnpm --filter @candorlens/models typecheck
pnpm --filter @candorlens/web typecheck
```

Commit: `feat(models): add structured guidance providers`

## Task 9: Add private document context

**Files:**

- Create: `apps/web/src/app/(app)/documents/page.tsx`
- Create: `apps/web/src/app/(app)/documents/actions.ts`
- Create: `apps/web/src/components/documents/document-uploader.tsx`
- Create: `apps/web/src/server/documents/document-service.ts`
- Create: `apps/web/src/server/documents/document-service.test.ts`
- Create: `apps/web/src/server/documents/text-extractor.ts`
- Create: `apps/web/src/server/documents/text-extractor.test.ts`
- Create: `apps/web/src/server/documents/context-builder.ts`
- Create: `apps/web/src/server/documents/context-builder.test.ts`

**Step 1: Write failing validation and ownership tests**

Support PDF, plain text, and DOCX within a documented size limit. Reject mismatched signatures and extensions, executable formats, oversized files, empty extracted text, cross-user paths, and unsafe filenames. Verify private signed URLs expire.

**Step 2: Implement private upload and extraction**

Upload to `<user-id>/<document-id>/<sanitized-name>` in the private `documents` bucket. Extract text server side with pinned libraries and strict byte limits. Store normalized text and extraction status. Do not expose permanent public URLs.

**Step 3: Build bounded context**

Select only user-approved documents for an interview profile. Chunk deterministically and apply a character or token budget. Include source document IDs in the internal context result for traceability.

**Step 4: Verify and commit**

Commit: `feat(web): add private interview documents`

## Task 10: Build the live-session controller and interface

**Files:**

- Create: `apps/web/src/features/live-session/live-session-controller.ts`
- Create: `apps/web/src/features/live-session/live-session-controller.test.ts`
- Create: `apps/web/src/features/live-session/hooks/use-live-session.ts`
- Create: `apps/web/src/features/live-session/components/live-session-screen.tsx`
- Create: `apps/web/src/features/live-session/components/transcript-panel.tsx`
- Create: `apps/web/src/features/live-session/components/question-card.tsx`
- Create: `apps/web/src/features/live-session/components/guidance-card.tsx`
- Create: `apps/web/src/features/live-session/components/connection-status.tsx`
- Create: `apps/web/src/features/live-session/components/live-session-screen.test.tsx`
- Create: `apps/web/src/app/(app)/sessions/[sessionId]/live/page.tsx`

**Contract:**

```ts
export interface LiveSessionController {
  prepare(selection: CaptureSelection): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  reconnect(): Promise<void>;
  requestGuidance(questionId: string): Promise<void>;
  subscribe(listener: (snapshot: LiveSessionSnapshot) => void): () => void;
  dispose(): Promise<void>;
}
```

**Step 1: Write failing orchestration tests**

Cover start order, consent persistence before permission, one credential and transcriber connection per active source, credential acquisition after source confirmation, capture and transcriber wiring, final transcript persistence, automatic rule-based question detection, manual guidance request, stop order, disposal, interruption, and provider switch before capture.

**Step 2: Implement the controller**

Keep orchestration independent of React. Inject capture, transcriber factory, repositories, detector, and guidance client. Create one transcriber connection per active audio source so microphone and browser audio retain separate source labels. Merge only transcript events, never unlabeled audio. The controller must make stop idempotent and must stop browser tracks even if provider shutdown fails.

**Step 3: Implement the interface**

Layout priorities:

- Persistent top-level capture indicator and stop control.
- Current question and guidance in the main reading area.
- Incremental transcript in a secondary panel with partial text visually distinguished.
- Provider and connection state visible without opening settings.
- Clear empty, reconnecting, permission-denied, provider-unavailable, and finished states.

Do not obscure meeting controls or encourage placing the app over another participant. This is a normal browser page and remains visible in browser sharing when selected.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/web test -- live-session-controller.test.ts live-session-screen.test.tsx
pnpm --filter @candorlens/web lint
pnpm --filter @candorlens/web typecheck
```

Commit: `feat(web): add live-session experience`

## Task 11: Add durable event buffering and recovery

**Files:**

- Create: `apps/web/src/features/live-session/event-buffer.ts`
- Create: `apps/web/src/features/live-session/event-buffer.test.ts`
- Create: `apps/web/src/data/live-events/repository.ts`
- Create: `apps/web/src/data/live-events/repository.test.ts`
- Create: `apps/web/src/features/live-session/recovery.ts`
- Create: `apps/web/src/features/live-session/recovery.test.ts`
- Modify: `apps/web/src/features/live-session/live-session-controller.ts`

**Step 1: Write failing recovery tests**

Cover offline final segments, duplicate resend, ordering, browser refresh, storage quota failure, expired realtime credential, provider disconnect, and user stop while reconnecting.

**Step 2: Implement a bounded local buffer**

Store final transcript and domain events in IndexedDB with session ID, stable event ID, sequence, payload version, and persisted flag. Do not store raw audio in the web client. Enforce a bounded record and byte count. On quota failure, keep capture visible, warn the user, and allow immediate stop.

**Step 3: Implement idempotent persistence**

Use unique event identifiers and database upserts. Flush in order after connectivity returns. Never duplicate utterances, questions, or guidance events.

**Step 4: Verify and commit**

Commit: `feat(web): add live-session recovery`

## Task 12: Add optional recordings, session history, and privacy controls

**Files:**

- Create: `apps/web/src/features/recording/browser-recorder.ts`
- Create: `apps/web/src/features/recording/browser-recorder.test.ts`
- Create: `apps/web/src/features/recording/recording-consent.tsx`
- Create: `apps/web/src/features/recording/recording-consent.test.tsx`
- Create: `apps/web/src/server/recordings/recording-upload.ts`
- Create: `apps/web/src/server/recordings/recording-upload.test.ts`
- Create: `apps/web/src/app/api/recordings/upload-token/route.ts`
- Create: `packages/core/src/usage/cost-estimate.ts`
- Create: `packages/core/src/usage/cost-estimate.test.ts`
- Create: `apps/web/src/server/usage/rate-card.ts`
- Create: `apps/web/src/server/usage/rate-card.test.ts`
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`
- Modify: `apps/web/src/app/(app)/sessions/[sessionId]/page.tsx`
- Create: `apps/web/src/features/history/session-timeline.tsx`
- Create: `apps/web/src/features/history/transcript-search.tsx`
- Create: `apps/web/src/app/(app)/settings/page.tsx`
- Create: `apps/web/src/app/(app)/settings/actions.ts`
- Create: `apps/web/src/server/privacy/delete-session.ts`
- Create: `apps/web/src/server/privacy/delete-session.test.ts`
- Create: `apps/web/src/server/privacy/apply-retention.ts`
- Create: `apps/web/src/server/privacy/apply-retention.test.ts`
- Create: `apps/web/src/app/api/maintenance/retention/route.ts`

**Step 1: Write failing recording tests**

Verify recording is off by default, requires a separate explicit confirmation, records only selected audio sources, shows `Recording` independently from `Transcribing`, stops all recorders with capture, validates supported MIME types, and never sends a large media body through a conventional Vercel function.

**Step 2: Implement private source-specific recording**

When enabled, create one `MediaRecorder` per selected audio source using the best supported compressed audio MIME type. Request an owner-scoped resumable upload target from the authenticated server, then upload chunks directly to the private `recordings` bucket. Store one recording row per source with checksum, duration, and final status.

Do not store recording chunks in IndexedDB. Keep only a small bounded in-memory upload queue. If that queue reaches 16 MiB, stop the recording portion, keep transcription active, and show a persistent warning. A failed upload remains retryable from the session detail page without making the object public.

**Step 3: Add versioned usage estimates**

Implement a pure cost estimator that accepts usage units and a versioned server rate card. Never hardcode current provider prices in domain code. If no reviewed rate exists for a model, show usage units and `Estimate unavailable`. Label every monetary value as an estimate and include the rate-card effective date.

**Step 4: Complete dashboard and session history**

The dashboard shows recent sessions, capture readiness, provider availability, usage units, and estimates. The session detail page adds source-aware transcript search, detected-question navigation, guidance and error timeline, recording status and private playback links, and retry actions for failed document or recording processing.

**Step 5: Add privacy and retention settings**

Let the owner select transcript and artifact retention from approved bounded options, choose whether recording is offered by default, and request complete session deletion. Deletion requires explicit confirmation and removes private documents linked only to that session, recordings, exports, child rows, and the session. If storage deletion fails, keep database references and report the incomplete stage rather than claiming deletion succeeded.

The retention route authenticates a dedicated scheduled secret, processes a bounded batch, records only IDs and outcomes, and is safe to retry. Adding a production schedule is an explicit deployment approval gate.

**Step 6: Verify and commit**

```powershell
pnpm --filter @candorlens/core test -- cost-estimate.test.ts
pnpm --filter @candorlens/web test -- browser-recorder.test.ts recording-consent.test.tsx recording-upload.test.ts rate-card.test.ts delete-session.test.ts apply-retention.test.ts
pnpm --filter @candorlens/web typecheck
pnpm exec supabase test db
```

Commit: `feat(web): add recordings history and privacy controls`

## Task 13: Add end-to-end, security, and accessibility coverage

**Files:**

- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/fixtures/provider-fixture.ts`
- Create: `apps/web/e2e/fixtures/media-fixture.ts`
- Create: `apps/web/e2e/live-session.spec.ts`
- Create: `apps/web/e2e/live-session-errors.spec.ts`
- Create: `apps/web/e2e/ownership.spec.ts`
- Create: `apps/web/e2e/accessibility.spec.ts`
- Modify: `supabase/tests/platform_foundation.test.sql`

**Step 1: Create deterministic browser fixtures**

Use Chromium fake media flags or an injected media adapter for automated tests. Use the fixture transcription and guidance providers. Paid provider traffic must remain off.

**Step 2: Cover the critical path**

Test sign-in, session creation, source selection, consent, optional recording consent, permission, visible capture state, fixture transcript, question detection, guidance, stop, recording finalization, persistence, history search, reload, retention settings, deletion, and session ownership.

**Step 3: Cover failures and safety invariants**

Test denied permission, display source with no audio, provider failure, offline buffer, expired credential, stop during failure, cleanup on navigation, keyboard-only control, focus management, live-region announcements, reduced motion, and the absence of any hidden-capture option.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/web test:e2e
pnpm exec supabase test db
```

Commit: `test(web): cover live-session flows`

## Task 14: Preview verification and handoff

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
pnpm test:e2e
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm exec supabase db lint --level warning
```

**Step 2: Run optional provider smoke tests only with approval**

Use one short transcription fixture per provider and one short structured-guidance request. Cap the test duration and record only operational metadata. Do not upload personal interview content.

**Step 3: Deploy and manually test a Vercel preview**

Test current stable Chrome and Edge on Windows. Confirm microphone-only, available display audio, combined sources, explicit stop, track cleanup, provider selection, reconnection, document context, optional recording, private playback, transcript search, retention settings, complete deletion, and sign-out. Record browser limitations precisely.

**Step 4: Review the diff**

Confirm provider keys are server only, every route validates ownership, browser tracks always stop, no raw audio is persisted, model identifiers are configurable, provider SDK imports stay in `packages/models`, and no stealth behavior exists.

**Step 5: Mark ready and stop**

Attach command results, browser matrix, preview URL, optional provider-smoke evidence, known limitations, and interface screenshots. Mark the pull request ready for review and stop. Do not start desktop capture before approval and merge.
