# CandorLens Windows Desktop Capture Implementation Plan

> Required workflow: Read the delivery runbook first, then execute task by task with test-first changes and review checkpoints.

**Goal:** Deliver a Windows-first Tauri client that visibly captures a user-selected microphone and system output, streams normalized audio through the existing provider contracts, and survives temporary network failure.

**Architecture:** Rust owns device enumeration, microphone and WASAPI loopback capture, audio normalization, and an encrypted bounded retry queue. The React webview owns consent, device selection, transcript, question, and guidance presentation. Authenticated web endpoints mint realtime credentials and generate guidance, so long-lived provider keys never enter the desktop client.

**Prerequisite:** The web live-session pull request is approved and merged. Create `feature/desktop-capture` from the updated `main` branch.

## Completion boundary

This milestone includes:

- Windows 11 x64 support with a documented Windows 10 best-effort status.
- Microphone device capture.
- Shared-mode WASAPI output loopback capture.
- Explicit device and source selection.
- A normal, visible Tauri window with a persistent capture indicator and stop control.
- PCM normalization and source-tagged frame delivery.
- Desktop authentication and owner-scoped API access.
- Encrypted, bounded local retry buffering.
- Optional, separately consented private source recordings.
- Shared Gemini and OpenAI transcription and guidance behavior.
- Windows CI, debug artifacts, and manual device testing.

It excludes macOS and Linux capture, protected-content workarounds, exclusive-mode loopback, screen-share bypass, capture-evasive windows, unsigned public release distribution, and automatic update delivery.

## Task 1: Add Windows capture dependencies and minimal capabilities

**Files:**

- Modify: `apps/desktop/package.json`
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/capabilities/default.json`
- Create: `apps/desktop/src-tauri/src/platform/mod.rs`
- Create: `apps/desktop/src-tauri/src/platform/windows.rs`
- Create: `apps/desktop/src-tauri/src/platform/unsupported.rs`
- Create: `apps/desktop/src-tauri/src/security/redaction.rs`
- Create: `apps/desktop/src-tauri/src/security/redaction_test.rs`
- Modify: `.env.example`

**Step 1: Write a failing platform test**

Test that Windows reports capture support and other targets return a typed unsupported-platform result without requesting permissions. Add redaction tests for bearer tokens, refresh tokens, cookies, and provider credentials.

**Step 2: Add pinned compatible dependencies**

Use current Tauri 2.x-compatible versions and commit the Rust lockfile. Required categories:

- `windows` crate with Core Audio and COM features for WASAPI.
- `cpal` for microphone device capture where it provides the required Windows behavior.
- `tokio`, `serde`, `serde_json`, `thiserror`, `uuid`, and `tracing`.
- `aes-gcm`, `zeroize`, and Tauri Stronghold for encrypted retry storage.
- Tauri opener, deep-link, and single-instance plugins for authentication handoff.

Do not add shell execution, global shortcut, process control, or broad filesystem plugins.

**Step 3: Declare only required Tauri capabilities**

Allow the application commands created in this plan, system-browser opening for authentication, the registered CandorLens callback scheme, and Stronghold access. Restrict filesystem access to the application data directory used for the encrypted queue. Keep all other permissions denied.

**Step 4: Verify and commit**

```powershell
pnpm install
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml platform security
cargo tree --manifest-path apps/desktop/src-tauri/Cargo.toml
```

Review the dependency graph for duplicate major cryptography libraries and unexpected native binaries.

Commit: `build(desktop): add Windows capture dependencies`

## Task 2: Define native capture contracts and state machine

**Files:**

- Create: `apps/desktop/src-tauri/src/audio/mod.rs`
- Create: `apps/desktop/src-tauri/src/audio/types.rs`
- Create: `apps/desktop/src-tauri/src/capture/mod.rs`
- Create: `apps/desktop/src-tauri/src/capture/state.rs`
- Create: `apps/desktop/src-tauri/src/capture/state_test.rs`
- Create: `apps/desktop/src/lib/native-capture.ts`
- Create: `apps/desktop/src/lib/native-capture.test.ts`

**Rust contracts:**

```rust
pub enum AudioSourceKind {
    Microphone,
    SystemOutput,
}

pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub source: AudioSourceKind,
    pub is_default: bool,
    pub channels: u16,
    pub sample_rate: u32,
}

pub struct CaptureConfig {
    pub session_id: String,
    pub microphone_device_id: Option<String>,
    pub output_device_id: Option<String>,
    pub target_sample_rate: u32,
    pub frame_duration_ms: u16,
}

pub enum CaptureState {
    Idle,
    Preparing,
    Ready,
    Capturing,
    Interrupted,
    Stopping,
    Failed,
}
```

Commands must expose `list_audio_devices`, `prepare_capture`, `start_capture`, `stop_capture`, `capture_status`, and `discard_buffer`. Native events must expose `capture://state`, `capture://audio-frame`, `capture://level`, `capture://device-lost`, and `capture://error`.

**Step 1: Write failing state tests**

Cover prepare, start without consent token, repeated start, stop from every active state, device loss, reconnect, error, buffer discard, and application shutdown. Require stop and shutdown to be idempotent.

**Step 2: Implement the pure Rust state machine**

Keep device handles and worker tasks outside the state value. State transitions return effects for the command layer to execute. Redact device backend identifiers from user-visible errors when they contain system paths.

**Step 3: Implement the typed TypeScript bridge**

Validate every command result and event payload with Zod before passing it to React. Map native errors to stable categories: `permission`, `device-unavailable`, `device-lost`, `format`, `buffer`, `network`, and `internal`.

**Step 4: Verify and commit**

```powershell
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml capture
pnpm --filter @candorlens/desktop test -- native-capture.test.ts
```

Commit: `feat(desktop): add native capture contracts`

## Task 3: Implement audio-device enumeration

**Files:**

- Create: `apps/desktop/src-tauri/src/audio/device.rs`
- Create: `apps/desktop/src-tauri/src/audio/device_test.rs`
- Create: `apps/desktop/src-tauri/src/commands/audio_devices.rs`
- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Create: `apps/desktop/src/features/capture/device-selection.ts`
- Create: `apps/desktop/src/features/capture/device-selection.test.ts`
- Create: `apps/desktop/src/features/capture/device-picker.tsx`
- Create: `apps/desktop/src/features/capture/device-picker.test.tsx`

**Step 1: Write failing backend-independent tests**

Abstract enumeration behind `AudioDeviceBackend`. Test stable IDs, duplicate display names, default-device marking, disconnected devices, no microphone, no output endpoint, and permission errors.

**Step 2: Implement Windows enumeration**

Initialize COM on the worker thread and enumerate active capture endpoints and active render endpoints. Return human-readable endpoint names and opaque IDs. Cleanly release COM interfaces. Never enumerate inactive devices unless a future user-facing option requires it.

**Step 3: Implement explicit selection UI**

Show microphone and system-output sections, default badges, refresh, and a test-level meter. Do not start recording from a device-card click. Require the separate consent and start action.

**Step 4: Verify and commit**

```powershell
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml audio::device
pnpm --filter @candorlens/desktop test -- device-selection.test.ts device-picker.test.tsx
```

Commit: `feat(desktop): add audio device selection`

## Task 4: Implement microphone capture

**Files:**

- Create: `apps/desktop/src-tauri/src/audio/microphone.rs`
- Create: `apps/desktop/src-tauri/src/audio/microphone_test.rs`
- Create: `apps/desktop/src-tauri/src/audio/sample_convert.rs`
- Create: `apps/desktop/src-tauri/src/audio/sample_convert_test.rs`

**Step 1: Write failing conversion and lifecycle tests**

Test signed 16-bit, unsigned 16-bit, 32-bit integer, and 32-bit float conversion to normalized mono float samples. Cover interleaved channels, clipping, silence, callback failure, device loss, and stop while a callback is active.

Use a fake input stream backend for lifecycle tests. Hardware access is reserved for manual integration tests.

**Step 2: Implement the microphone backend**

Open only the selected device. Choose a supported shared format, capture on a dedicated callback thread, copy bounded chunks into a non-blocking channel, and perform heavier conversion off the realtime callback. On channel overflow, emit a metric and bounded interruption warning rather than block the audio thread.

**Step 3: Verify and commit**

```powershell
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml audio::microphone audio::sample_convert
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
```

Commit: `feat(desktop): add microphone capture`

## Task 5: Implement shared-mode WASAPI loopback

**Files:**

- Create: `apps/desktop/src-tauri/src/audio/wasapi_loopback.rs`
- Create: `apps/desktop/src-tauri/src/audio/wasapi_loopback_test.rs`
- Create: `apps/desktop/src-tauri/src/audio/windows_backend.rs`
- Create: `apps/desktop/src-tauri/tests/wasapi_loopback_smoke.rs`

**Step 1: Write failing backend tests**

Wrap COM and WASAPI calls behind narrow interfaces so tests can simulate endpoint format, empty buffers, silent flags, discontinuities, device invalidation, default-device change, startup failure, and clean shutdown.

**Step 2: Implement loopback capture**

Use `AUDCLNT_STREAMFLAGS_LOOPBACK` with a render endpoint in shared mode. Obtain the endpoint mix format, use event-driven buffering where supported, and handle silent packets without reading undefined sample data. Surface discontinuity and invalidated-device events.

Do not attempt exclusive-mode loopback, DRM bypass, process injection, protected-content capture, or lower-level interception. If Windows returns silence for protected or unavailable content, report the limitation.

**Step 3: Add an ignored hardware smoke test**

The test lists render endpoints, opens a selected endpoint, captures a short bounded interval while ordinary test audio is playing, verifies at least one non-silent frame, then closes all handles. Keep it ignored in standard CI and document the command for approved manual runs.

```powershell
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --test wasapi_loopback_smoke -- --ignored --nocapture
```

**Step 4: Verify and commit**

Commit: `feat(desktop): add WASAPI loopback capture`

## Task 6: Normalize, frame, and source-tag audio

**Files:**

- Create: `apps/desktop/src-tauri/src/audio/resample.rs`
- Create: `apps/desktop/src-tauri/src/audio/resample_test.rs`
- Create: `apps/desktop/src-tauri/src/audio/frame.rs`
- Create: `apps/desktop/src-tauri/src/audio/frame_test.rs`
- Create: `apps/desktop/src-tauri/src/audio/pipeline.rs`
- Create: `apps/desktop/src-tauri/src/audio/pipeline_test.rs`

**Step 1: Write failing signal tests**

Generate deterministic sine waves to verify duration, frequency preservation within tolerance, mono conversion, exact frame sizes, sequence numbers, source tags, clipping, trailing samples, and independent source clocks.

**Step 2: Implement normalization**

Normalize device samples to mono float, resample to the transcriber-requested rate, convert to little-endian PCM16, and emit bounded frames. Do not mix microphone and output into one unlabeled stream. Each frame keeps its source so speaker defaults remain explainable.

**Step 3: Implement backpressure**

Use bounded channels. If downstream cannot keep up, write eligible frames to the encrypted retry queue from Task 7. If both live and retry capacities are exhausted, transition to interrupted and tell the user that some audio may be unavailable.

**Step 4: Verify and commit**

```powershell
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml audio::resample audio::frame audio::pipeline
```

Commit: `feat(desktop): add native audio pipeline`

## Task 7: Add encrypted bounded retry storage

**Files:**

- Create: `apps/desktop/src-tauri/src/buffer/mod.rs`
- Create: `apps/desktop/src-tauri/src/buffer/manifest.rs`
- Create: `apps/desktop/src-tauri/src/buffer/encrypted_queue.rs`
- Create: `apps/desktop/src-tauri/src/buffer/encrypted_queue_test.rs`
- Create: `apps/desktop/src-tauri/src/security/key_store.rs`
- Create: `apps/desktop/src-tauri/src/security/key_store_test.rs`
- Create: `apps/desktop/src-tauri/src/commands/buffer.rs`

**Contract:**

```rust
pub struct BufferedFrameMeta {
    pub session_id: String,
    pub frame_id: String,
    pub sequence: u64,
    pub source: AudioSourceKind,
    pub captured_at_ms: u64,
    pub sample_rate: u32,
    pub byte_length: u32,
}
```

**Step 1: Write failing queue tests**

Cover encrypt and decrypt round-trip, tampering, wrong key, crash-safe manifest recovery, FIFO order, duplicate frame ID, per-session separation, byte limit, age limit, explicit discard, successful flush deletion, and key zeroization.

**Step 2: Implement key storage and encryption**

Generate a random data-encryption key and store it through Tauri Stronghold in the application data directory. Encrypt each frame with AES-256-GCM using a unique random nonce and authenticated metadata. Never write plaintext PCM or the key to disk. Zeroize in-memory key copies where practical.

**Step 3: Enforce strict limits**

Default to a maximum of 60 seconds of audio or 16 MiB per session, whichever is reached first. Make the limit visible in settings but do not allow unbounded configuration. Delete successfully transmitted frames and delete all session frames after completion or explicit discard. Provide a visible `Discard buffered audio` action.

**Step 4: Verify and commit**

```powershell
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml buffer security
```

Commit: `feat(desktop): add encrypted retry buffer`

## Task 8: Implement desktop authentication

**Files:**

- Create: `apps/web/src/app/desktop/authorize/page.tsx`
- Create: `apps/web/src/app/desktop/authorize/actions.ts`
- Create: `apps/desktop/src-tauri/src/auth/mod.rs`
- Create: `apps/desktop/src-tauri/src/auth/pkce.rs`
- Create: `apps/desktop/src-tauri/src/auth/pkce_test.rs`
- Create: `apps/desktop/src-tauri/src/commands/auth.rs`
- Create: `apps/desktop/src/features/auth/desktop-auth.ts`
- Create: `apps/desktop/src/features/auth/desktop-auth.test.ts`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/src/lib.rs`

**Step 1: Write failing authentication tests**

Cover random state and PKCE verifier generation, mismatched state, expired authorization, callback replay, user cancellation, refresh, sign-out, and redacted failures. Verify that session material is never stored in browser local storage or plaintext desktop files.

**Step 2: Implement system-browser authorization**

Open the trusted web origin in the system browser with a short-lived state and PKCE challenge. After the signed-in user confirms desktop access, return through the registered `candorlens://auth/callback` scheme. The desktop app validates state and exchanges the one-time code through the authenticated backend.

Use the single-instance plugin so the callback reaches the existing window. Bring the normal app window to the foreground after callback. Do not hide it.

**Step 3: Store session material securely**

Store refresh material through Stronghold. Keep access tokens in memory and refresh through the backend. On sign-out, revoke where supported, clear Stronghold entries, and delete buffered session audio.

**Step 4: Verify and commit**

Commit: `feat(desktop): add secure sign-in handoff`

## Task 9: Connect native capture to shared live-session services

**Files:**

- Create: `apps/desktop/src/services/capture-frame-source.ts`
- Create: `apps/desktop/src/services/capture-frame-source.test.ts`
- Create: `apps/desktop/src/services/desktop-api-client.ts`
- Create: `apps/desktop/src/services/desktop-api-client.test.ts`
- Create: `apps/desktop/src/features/session/desktop-session-controller.ts`
- Create: `apps/desktop/src/features/session/desktop-session-controller.test.ts`
- Create: `apps/web/src/app/api/desktop/session/route.ts`
- Modify: `packages/models/src/contracts/transcription.ts`

**Step 1: Write failing bridge tests**

Cover native frame ordering, one credential and transcriber connection per active source, per-source resampling requirements, credential refresh, provider selection, final transcript persistence, guidance calls, duplicate buffered frames, disconnect, device loss, stop during flush, and sign-out during capture.

**Step 2: Implement the frame source**

Translate validated Tauri events into the shared `AudioFrame` contract. Keep native frame payloads binary or base64 only at the command boundary and avoid repeated copies where Tauri supports binary channels.

**Step 3: Implement authenticated API access**

The desktop API client sends the Supabase access token to the existing authenticated web routes. Server routes validate claims, owner scope, consent, and session state exactly as the browser routes do. Do not create a desktop-only provider-key path.

**Step 4: Implement desktop orchestration**

Reuse shared transcriber, detector, and guidance contracts. Start order is consent record, native preparation, one short-lived credential and transcriber connection for each active source, then native start. Keep microphone and output audio on separate transcriber connections so speaker-source mapping remains explainable. Stop order is native stop, final frame flush, transcriber finish, persisted final events, buffer deletion, completed state.

**Step 5: Verify and commit**

```powershell
pnpm --filter @candorlens/desktop test -- capture-frame-source.test.ts desktop-api-client.test.ts desktop-session-controller.test.ts
pnpm --filter @candorlens/desktop typecheck
```

Commit: `feat(desktop): connect live-session services`

## Task 10: Add optional private desktop recording

**Files:**

- Create: `apps/desktop/src-tauri/src/recording/mod.rs`
- Create: `apps/desktop/src-tauri/src/recording/wav_segment.rs`
- Create: `apps/desktop/src-tauri/src/recording/wav_segment_test.rs`
- Create: `apps/desktop/src-tauri/src/recording/recording_queue.rs`
- Create: `apps/desktop/src-tauri/src/recording/recording_queue_test.rs`
- Create: `apps/desktop/src-tauri/src/commands/recording.rs`
- Create: `apps/desktop/src/services/recording-upload.ts`
- Create: `apps/desktop/src/services/recording-upload.test.ts`
- Create: `apps/desktop/src/features/recording/recording-consent.tsx`
- Create: `apps/desktop/src/features/recording/recording-consent.test.tsx`

**Step 1: Write failing recording tests**

Verify recording is disabled by default, requires consent separate from transcription, preserves source identity, produces valid bounded WAV segments, encrypts every local segment, resumes idempotent upload, stops with capture, finalizes metadata, and deletes encrypted temporary files after confirmed upload or explicit discard.

**Step 2: Implement source-specific segmented recording**

When enabled, write microphone and system-output PCM to separate one-minute WAV segments. Encrypt each completed segment with the queue key before it reaches disk. Store only the encrypted form locally. Do not combine sources into an unlabeled recording.

**Step 3: Implement direct private upload**

Use the authenticated backend to obtain an owner-scoped resumable upload target for `<user-id>/<session-id>/<source>/<segment-id>.wav`. Stream-decrypt into the upload request without creating a plaintext temporary file. Persist checksum, duration, source, and completion state in the recording row.

Bound pending recording data to a user-visible maximum of 256 MiB. If the limit is reached, stop recording, keep live transcription active, and show a persistent warning. Never delete an unconfirmed upload unless the user explicitly discards it.

**Step 4: Verify and commit**

```powershell
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml recording
pnpm --filter @candorlens/desktop test -- recording-upload.test.ts recording-consent.test.tsx
```

Commit: `feat(desktop): add optional private recording`

## Task 11: Build the visible desktop session interface

**Files:**

- Create: `apps/desktop/src/features/session/desktop-session-screen.tsx`
- Create: `apps/desktop/src/features/session/desktop-session-screen.test.tsx`
- Create: `apps/desktop/src/features/session/native-capture-indicator.tsx`
- Create: `apps/desktop/src/features/session/native-capture-indicator.test.tsx`
- Create: `apps/desktop/src/features/session/transcript-view.tsx`
- Create: `apps/desktop/src/features/session/guidance-view.tsx`
- Create: `apps/desktop/src/features/settings/audio-settings.tsx`
- Modify: `apps/desktop/src/app.tsx`

**Step 1: Write failing interface tests**

Cover signed-out, device selection, transcription consent, optional recording consent, preparing, capturing, recording, interrupted, device lost, retry-buffer warning, recording-queue warning, stopping, completed, and failed states. Verify keyboard stop, accessible status announcements, window-close confirmation during capture, and no hidden-window action.

**Step 2: Implement the session screen**

Use the same information hierarchy as the browser session. Keep the capture indicator and stop button visible in the main window. Show active microphone, output device, provider, connection state, transcript buffer use, recording state and queue use, elapsed time, current question, guidance, and transcript.

The Tauri window must use ordinary visibility and capture behavior. Do not set display-affinity flags, content-protection flags, transparent click-through overlays, always-on-top by default, taskbar hiding, or capture exclusion.

**Step 3: Implement close and suspend handling**

Closing the window while capture is active prompts the user to stop and discard or stop and flush. Windows suspend, device change, or lost connectivity transitions visibly to interrupted. Resume requires a visible user action when permission or device selection changed.

**Step 4: Verify and commit**

Commit: `feat(desktop): add visible capture experience`

## Task 12: Add Windows CI and integration coverage

**Files:**

- Modify: `.github/workflows/desktop.yml`
- Create: `apps/desktop/src-tauri/tests/capture_lifecycle.rs`
- Create: `apps/desktop/e2e/desktop-session.spec.ts`
- Create: `apps/desktop/scripts/verify-capabilities.mjs`
- Modify: `README.md`

**Step 1: Add non-hardware integration tests**

Use fake device and transport backends to test the full native lifecycle, encryption queue, event emission, and webview controller without physical hardware or paid providers.

**Step 2: Harden the Windows workflow**

Run Rust format, Clippy with warnings denied, Rust tests, frontend lint, typecheck, unit tests, capability verification, and `tauri build --debug` on a pinned Windows runner. Upload the debug bundle as a short-retention workflow artifact. Do not sign or publish it.

**Step 3: Verify capability allowlists**

The script fails if shell, process, global shortcut, unrestricted filesystem, hidden-window, or unplanned network capabilities appear.

**Step 4: Verify and commit**

```powershell
pnpm --filter @candorlens/desktop test
pnpm --filter @candorlens/desktop typecheck
cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm --filter @candorlens/desktop tauri build --debug
```

Commit: `ci: verify Windows desktop capture`

## Task 13: Manual hardware matrix and handoff

**Files:**

- Create: `docs/testing/windows-audio-matrix.md`
- Modify: Pull-request description and checklist

**Step 1: Run the complete clean verification**

Run every root gate, Supabase test, web end-to-end test, Rust gate, and Tauri debug build from the delivery runbook.

**Step 2: Execute the approved hardware matrix**

At minimum test:

- Windows 11 x64 with built-in microphone and speakers.
- One USB or Bluetooth microphone when available.
- Default-output change during capture.
- Microphone unplug during capture.
- Ordinary browser audio through Chrome or Edge.
- Ordinary meeting audio through Teams or Zoom when available and consented.
- Network loss and recovery within the encrypted buffer limit.
- Buffer exhaustion behavior.
- Optional recording, private upload, playback from the web session detail, and encrypted temporary-file cleanup.
- System suspend and resume.
- User stop, window close, and sign-out cleanup.
- A desktop-created session appearing in the web dashboard with matching transcript, questions, guidance, and recording metadata.

Record operating-system build, device category, success, limitation, and cleanup result. Do not record participant content.

**Step 3: Review the safety boundary**

Inspect Tauri configuration and Windows API usage. Confirm no capture exclusion, screen-share bypass, hidden overlay, protected-content workaround, broad filesystem access, shell execution, global shortcut, or background capture after the visible window closes.

**Step 4: Mark ready and stop**

Attach full command results, CI link, debug artifact link, hardware matrix, known limitations, and interface screenshots. Mark the pull request ready for review and stop. Do not start defense analysis before approval and merge.
