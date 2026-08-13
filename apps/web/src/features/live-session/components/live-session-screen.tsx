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
import type { ConfigurableProvider } from '../../../data/provider-credentials/input';
import {
  createLiveSessionState,
  reduceLiveSession,
  type LiveSessionState,
} from '../live-session-machine';
import { GuidanceCard } from './guidance-card';
import {
  createChunkedTranscriptionController,
  type ChunkedTranscriptionController,
} from '../chunked-transcription-controller';

type LiveSessionScreenProps = {
  session: SessionRecord;
  capabilities?: BrowserCaptureCapabilities;
  createCaptureController?: () => BrowserCaptureController;
  createTranscriptionController?: (
    sessionId: string,
    startingSequence: number,
  ) => ChunkedTranscriptionController;
  fetchImpl?: typeof fetch;
  guidanceProviders?: readonly ConfigurableProvider[];
  initialGuidance?: {
    provider: ConfigurableProvider;
    text: string;
  } | null;
  initialNotes?: string[];
  initialTranscript?: LiveSessionState['transcript'];
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
  createTranscriptionController = (sessionId, startingSequence) =>
    createChunkedTranscriptionController({ sessionId, startingSequence }),
  fetchImpl = fetch,
  guidanceProviders = [],
  initialGuidance = null,
  initialNotes = [],
  initialTranscript = [],
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
  const [state, setState] = useState(() =>
    createLiveSessionState(session, {
      notes: initialNotes,
      transcript: initialTranscript,
    }),
  );
  const [note, setNote] = useState('');
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(
    null,
  );
  const controllerRef = useRef<BrowserCaptureController | null>(null);
  const transcriptionControllerRef =
    useRef<ChunkedTranscriptionController | null>(null);
  const persistedTranscriptIdsRef = useRef(
    new Set(initialTranscript.map((item) => item.id)),
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!suppliedCapabilities)
      setCapabilities(inspectBrowserCaptureCapabilities());
  }, [suppliedCapabilities]);

  useEffect(
    () => () => {
      unsubscribeRef.current?.();
      void transcriptionControllerRef.current?.stop();
      void controllerRef.current?.dispose();
    },
    [],
  );

  useEffect(() => {
    const pending = state.transcript.filter(
      (item) =>
        !item.partial && !persistedTranscriptIdsRef.current.has(item.id),
    );
    for (const item of pending) {
      persistedTranscriptIdsRef.current.add(item.id);
      void fetchImpl(`/api/sessions/${session.id}/events`, {
        body: JSON.stringify({
          confidence: item.confidence,
          endMs: item.endMs,
          id: item.id,
          sequence: item.sequence,
          speaker:
            item.speaker === 'Interviewer' ? 'interviewer' : 'interviewee',
          startMs: item.startMs,
          text: item.text,
          type: 'utterance',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
        .then((response) => {
          if (!response.ok) throw new Error('Unable to save transcript.');
          setPersistenceWarning(null);
        })
        .catch(() => {
          persistedTranscriptIdsRef.current.delete(item.id);
          setPersistenceWarning(
            'A transcript event could not be saved. Keep this page open and retry capture.',
          );
        });
    }
  }, [fetchImpl, session.id, state.transcript]);

  function transition(event: Parameters<typeof reduceLiveSession>[1]) {
    setState((current) => reduceLiveSession(current, event));
  }

  function handleControllerSnapshot(snapshot: BrowserCaptureSnapshot) {
    if (snapshot.status === 'interrupted') {
      const transcriptionController = transcriptionControllerRef.current;
      transcriptionControllerRef.current = null;
      void transcriptionController?.stop();
      transition({ type: 'capture-interrupted' });
    }
    if (snapshot.status === 'failed') {
      const transcriptionController = transcriptionControllerRef.current;
      transcriptionControllerRef.current = null;
      void transcriptionController?.stop();
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
    const sources: Array<'microphone' | 'browser-tab'> = [];
    if (selection.microphone) sources.push('microphone');
    if (selection.displayAudio) sources.push('browser-tab');
    const consentResponse = await fetchImpl(
      `/api/sessions/${session.id}/events`,
      {
        body: JSON.stringify({ sources, type: 'consent' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    );
    if (!consentResponse.ok) {
      throw new Error('Unable to record capture consent.');
    }
    const snapshot = await getController().prepare(selection);
    transition({ sources: snapshot.activeSources, type: 'sources-prepared' });
  }

  async function startCapture() {
    try {
      const controller = getController();
      await controller.start();
      if (session.providerId !== 'fixture') {
        const transcriptionController =
          transcriptionControllerRef.current ??
          createTranscriptionController(
            session.id,
            state.transcript.reduce(
              (maximum, item) => Math.max(maximum, item.sequence + 1),
              0,
            ),
          );
        transcriptionControllerRef.current = transcriptionController;
        transcriptionController.start(
          controller.audioSources(),
          (item) => transition({ item, type: 'transcript-finalized' }),
          (message) => setPersistenceWarning(message),
        );
      }
      transition({ type: 'capture-started' });
    } catch {
      const transcriptionController = transcriptionControllerRef.current;
      transcriptionControllerRef.current = null;
      await getController().stop('error');
      await transcriptionController?.stop();
      transition({
        message:
          'Unable to start capture. Review the selected browser sources.',
        type: 'capture-failed',
      });
    }
  }

  async function stopCapture() {
    const transcriptionController = transcriptionControllerRef.current;
    transcriptionControllerRef.current = null;
    await getController().stop('user');
    await transcriptionController?.stop();
    transition({ type: 'capture-stopped' });
  }

  function addNote() {
    const body = note.trim();
    if (!body) return;
    transition({ body, type: 'add-note' });
    setNote('');
    const randomPart =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    void fetchImpl(`/api/sessions/${session.id}/events`, {
      body: JSON.stringify({
        body,
        idempotencyKey: `note-${randomPart}`,
        type: 'note',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to save note.');
        setPersistenceWarning(null);
      })
      .catch(() =>
        setPersistenceWarning(
          'Your note is visible here but could not be saved. Copy it before leaving.',
        ),
      );
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
        {state.error ? (
          <p
            className="mb-5 rounded-xl border border-rose-200/15 bg-rose-400/10 px-4 py-3 text-sm text-[#ffd7dd]"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <ConsentPanel
          capabilities={capabilities}
          onRequestCapture={prepareCapture}
        />
        {guidanceProviders.length ? (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {guidanceProviders.map((provider) => (
              <span
                className="inline-flex min-h-9 items-center rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 font-mono text-xs font-medium text-[#a7e5c8]"
                key={provider}
              >
                {provider === 'openai' ? 'OpenAI' : 'Gemini'} guidance connected
              </span>
            ))}
          </div>
        ) : null}
        {initialGuidance ? (
          <div className="mt-6">
            <GuidanceCard
              fetchImpl={fetchImpl}
              initialGuidance={initialGuidance}
              mode={session.mode}
              notes={state.notes}
              providers={guidanceProviders}
              sessionId={session.id}
              title={session.title}
              transcript={state.transcript}
            />
          </div>
        ) : null}
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

      {persistenceWarning ? (
        <p
          className="rounded-xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-[#ffe2ac]"
          role="alert"
        >
          {persistenceWarning}
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
                : 'Audio is transcribed in short visible-capture segments using your configured provider. Final transcript events are saved to this session.'}
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

          <GuidanceCard
            fetchImpl={fetchImpl}
            initialGuidance={initialGuidance}
            mode={session.mode}
            notes={state.notes}
            providers={guidanceProviders}
            sessionId={session.id}
            title={session.title}
            transcript={state.transcript}
          />
        </aside>
      </div>
    </section>
  );
}
