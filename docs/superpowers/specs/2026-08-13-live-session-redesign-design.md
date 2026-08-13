# CandorLens Live Session Redesign

## Outcome

CandorLens becomes a coherent, dark technical workspace for visible, consented interview preparation and interviewer-led review. The signed-in product uses one design language from dashboard through session setup and the live workspace. The first live slice lets a user select browser-supported audio sources, review a clear consent notice, start and stop a visible capture lifecycle, and use deterministic fixture transcription when a live provider is not configured.

## Visual direction

- Dark-only, high-contrast operations interface with near-black navy surfaces, emerald for positive capture state, blue for informative focus, amber for degraded state, and rose only for destructive actions.
- Geist Sans is used for interface copy and Geist Mono for timings, status, and source metadata. No serif display fonts are used.
- A single shell carries all signed-in pages. It includes the product mark, primary navigation, a quiet account action, and a background signal grid that does not compete with reading.
- Cards use clear surface separation and 8px spacing rhythm. Primary buttons use white text on a saturated emerald fill. Secondary controls use an outlined dark surface with white text.
- Motion is restricted to entry, state transition, and short control feedback. It uses opacity and transform over 150-300ms and is removed for `prefers-reduced-motion`.

## Live session behavior

1. A session is created with a provider preference of OpenAI, Gemini, or deterministic fixture mode.
2. The live page presents source options for microphone and browser display audio. It never promises that a display source has usable audio before the browser chooser returns a track.
3. The user reads and acknowledges an explicit consent notice before the browser permission request becomes available.
4. Capture state is always visible at the top of the workspace with active source labels, elapsed time, and an immediate stop button.
5. In fixture mode, the workspace emits deterministic sample transcript events so the full state and layout can be verified without paid provider traffic. Live providers remain visibly unavailable until server-side keys and models are configured.
6. Browser capture uses standard user-invoked permission APIs only. It never hides the page, bypasses screen sharing, suppresses capture indicators, or records without consent.

## Architecture

- Server components load owner-scoped session records from Neon.
- A small client capture controller owns browser media tracks and exposes a testable lifecycle. It stops every acquired track on user stop, permission end, startup failure, and disposal.
- A client live workspace composes consent, source selection, capture state, fixture transcript output, notes, and guidance availability. No long-lived provider credential enters the browser.
- Provider availability is calculated server-side from environment variables. The browser receives only display labels and an availability status.
- The existing Neon session repository becomes provider-aware, but only creates owner-scoped drafts. Durable transcript persistence, realtime provider credentials, document upload, recordings, and post-session analysis are separate follow-on slices.

## Error and accessibility behavior

- Unsupported browser capability, permission denial, display capture without audio, and failed startup each have an in-place explanation and recovery action.
- All source controls have visible labels, native checkbox semantics, a keyboard-operable confirmation flow, focus rings, and a minimum 44px interactive target.
- The live state is announced through a polite status region. Reduced motion does not hide or delay a state update.
- Provider errors do not expose model keys, raw provider messages, or transcript text in logs or alerts.

## Scope split

This build implements the redesign, session-provider choice, consent state, browser capability checks, visible capture controller, fixture live screen, and local verification. It deliberately defers live OpenAI/Gemini transport until a server-side API key is available, plus durable event persistence, private document storage, optional recording, desktop capture, and defense analysis.
