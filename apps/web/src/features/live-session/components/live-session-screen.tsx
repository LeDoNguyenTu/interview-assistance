'use client';

import type { SessionRecord } from '@candorlens/core';
import { Button, Label } from '@candorlens/ui';
import { useEffect, useRef, useState } from 'react';

import {
  createBrowserCaptureController,
  createNavigatorMediaAdapter,
  type BrowserCaptureController,
  type BrowserCaptureSnapshot,
} from '../../capture/browser-capture-controller';
import {
  inspectBrowserCaptureCapabilities,
  type BrowserCaptureCapabilities,
} from '../../capture/browser-capabilities';
import type { CaptureSelection } from '../../capture/consent-machine';
import { ConsentPanel } from '../../capture/components/consent-panel';
import {
  createLiveSessionState,
  reduceLiveSession,
  type LiveSessionState,
} from '../live-session-machine';

type LiveSessionScreenProps = {
  session: SessionRecord;
  capabilities?: BrowserCaptureCapabilities;
  createCaptureController?: () => BrowserCaptureController;
};

function sourceLabel(source: 'microphone' | 'browser-tab'): string {
  return source === 'microphone' ? 'Microphone' : 'Browser display audio';
}

function statusLabel(state: LiveSessionState): string {
  switch (state.status) {
    case 'setup':
      return 'Setup required';
    case 'ready':
      return 'Sources ready';
    case 'capturing':
      return 'Capturing';
    case 'interrupted':
      return 'Capture interrupted';
    case 'finished':
      return 'Capture finished';
    case 'failed':
      return 'Setup needs attention';
  }
}

export function LiveSessionScreen({
  capabilities: suppliedCapabilities,
  createCaptureController = () =>
    createBrowserCaptureController(createNavigatorMediaAdapter()),
  session,
}: Readonly<LiveSessionScreenProps>) {
  const [capabilities, setCapabilities] = useState<BrowserCaptureCapabilities>(
    suppliedCapabilities ?? {
      audioWorklet: false,
      displayAudioRequested: false,
      displayMedia: false,
      microphone: false,
      secureContext: false,
    },
  );
  const [state, setState] = useState(() => createLiveSessionState(session));
  const [note, setNote] = useState('');
  const controllerRef = useRef<BrowserCaptureController | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!suppliedCapabilities)
      setCapabilities(inspectBrowserCaptureCapabilities());
  }, [suppliedCapabilities]);

  useEffect(
    () => () => {
      unsubscribeRef.current?.();
      void controllerRef.current?.dispose();
    },
    [],
  );

  function transition(event: Parameters<typeof reduceLiveSession>[1]) {
    setState((current) => reduceLiveSession(current, event));
  }

  function handleControllerSnapshot(snapshot: BrowserCaptureSnapshot) {
    if (snapshot.status === 'interrupted') {
      transition({ type: 'capture-interrupted' });
    }
    if (snapshot.status === 'failed') {
      transition({
        message: 'Unable to prepare the selected browser sources.',
        type: 'capture-failed',
      });
    }
  }

  function getController(): BrowserCaptureController {
    if (controllerRef.current) return controllerRef.current;

    const controller = createCaptureController();
    unsubscribeRef.current = controller.subscribe(handleControllerSnapshot);
    controllerRef.current = controller;
    return controller;
  }

  async function prepareCapture(selection: CaptureSelection) {
    const snapshot = await getController().prepare(selection);
    transition({ sources: snapshot.activeSources, type: 'sources-prepared' });
  }

  async function startCapture() {
    try {
      await getController().start();
      transition({ type: 'capture-started' });
    } catch {
      transition({
        message:
          'Unable to start capture. Review the selected browser sources.',
        type: 'capture-failed',
      });
    }
  }

  async function stopCapture() {
    await getController().stop('user');
    transition({ type: 'capture-stopped' });
  }

  function addNote() {
    transition({ body: note, type: 'add-note' });
    setNote('');
  }

  const currentQuestion = state.transcript.find(
    (item) => item.speaker === 'Interviewer' && item.text.endsWith('?'),
  );

  if (state.status === 'setup' || state.status === 'failed') {
    return (
      <section
        aria-label="Live session workspace"
        className="mx-auto max-w-3xl rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_28px_100px_rgb(0_0_0_/_0.28%)] sm:p-8"
      >
        <ConsentPanel
          capabilities={capabilities}
          onRequestCapture={prepareCapture}
        />
      </section>
    );
  }

  return (
    <section aria-label="Live session workspace" className="space-y-5">
      <div
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200/15 bg-[#0b261f]/90 p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04%)]"
        role="status"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={
              state.status === 'capturing'
                ? 'size-2.5 rounded-full bg-[#69e7ae] shadow-[0_0_0_6px_rgb(105_231_174_/_0.12%)]'
                : 'size-2.5 rounded-full bg-[#ffd08a] shadow-[0_0_0_6px_rgb(255_208_138_/_0.1)]'
            }
          />
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#acd8c4]">
              {statusLabel(state)}
            </p>
            <p className="mt-1 text-sm text-[#e9f3ef]">
              {state.activeSources.length
                ? state.activeSources.map(sourceLabel).join(' + ')
                : 'No active source'}
            </p>
          </div>
        </div>
        {state.status === 'capturing' ? (
          <Button onClick={stopCapture} type="button" variant="destructive">
            Stop capture
          </Button>
        ) : null}
      </div>

      {state.error ? (
        <p
          className="rounded-xl border border-rose-200/15 bg-rose-400/10 px-4 py-3 text-sm text-[#ffd7dd]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-5">
          <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_28px_100px_rgb(0_0_0_/_0.2%)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
                  Current question
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                  {currentQuestion?.text ?? 'Waiting for a question'}
                </h1>
              </div>
              {state.status === 'ready' ? (
                <Button onClick={startCapture} type="button">
                  Start visible capture
                </Button>
              ) : null}
            </div>
            <div
              aria-hidden="true"
              className="mt-10 h-20 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(90deg,transparent_0%,rgb(104_232_174_/_0.65)_15%,rgb(104_232_174_/_0.18)_28%,rgb(117_171_255_/_0.72)_50%,rgb(104_232_174_/_0.18)_72%,rgb(104_232_174_/_0.65)_85%,transparent_100%)] opacity-80 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
            />
            <p className="mt-5 text-sm leading-6 text-[#b9c9c4]">
              {session.providerId === 'fixture'
                ? 'Fixture mode provides deterministic sample transcript while browser capture remains visible and user-controlled.'
                : 'Provider setup is selected for this session. Live transcription activates only after its server-side runtime is configured.'}
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">
                Conversation transcript
              </h2>
              <span className="font-mono text-xs text-[#83dcb4]">
                {state.transcript.length} event
                {state.transcript.length === 1 ? '' : 's'}
              </span>
            </div>
            {state.transcript.length ? (
              <ol className="mt-5 space-y-4">
                {state.transcript.map((item) => (
                  <li
                    className="border-l-2 border-emerald-300/40 pl-4"
                    key={item.id}
                  >
                    <p className="font-mono text-xs uppercase tracking-[0.1em] text-[#90b8a8]">
                      {item.speaker} - {item.timestamp}
                    </p>
                    <p className="mt-2 text-base leading-7 text-[#e9f3ef]">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 text-sm leading-6 text-[#b9c9c4]">
                The transcript will appear here after capture starts.
              </p>
            )}
          </article>
        </div>

        <aside className="space-y-5">
          <article className="rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
              Session context
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              {session.title}
            </h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <dt className="text-[#90b8a8]">Mode</dt>
                <dd className="font-medium capitalize text-white">
                  {session.mode}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#90b8a8]">Provider</dt>
                <dd className="font-medium capitalize text-white">
                  {session.providerId === 'fixture'
                    ? 'Fixture preview'
                    : session.providerId}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6">
            <Label htmlFor="live-note">Private note</Label>
            <textarea
              className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-black/15 p-3 text-sm leading-6 text-white outline-none placeholder:text-[#719184] focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)]"
              id="live-note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add context for your own review"
              value={note}
            />
            <Button
              className="mt-3"
              onClick={addNote}
              type="button"
              variant="secondary"
            >
              Add note
            </Button>
            {state.notes.length ? (
              <ul className="mt-5 space-y-2">
                {state.notes.map((item) => (
                  <li
                    className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-[#dce8e3]"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </aside>
      </div>
    </section>
  );
}
