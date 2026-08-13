'use client';

import type { SessionRecord } from '@candorlens/core';
import {
  createFixtureWorkspace,
  reduceWorkspace,
} from '@candorlens/core/workspace';
import {
  Button,
  CaptureIndicator,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from '@candorlens/ui';
import { useReducer, useState } from 'react';

import {
  guidanceLabelForMode,
  normalizeGuidanceText,
} from '../../lib/guidance/presentation';

type GuidanceProvider = 'gemini' | 'openai';
type GuidanceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { provider: GuidanceProvider; status: 'ready'; text: string };

function workspaceReducer(
  state: ReturnType<typeof createFixtureWorkspace>,
  event: Parameters<typeof reduceWorkspace>[1],
) {
  return reduceWorkspace(state, event);
}

export function SessionWorkspace({
  session,
}: Readonly<{ session: SessionRecord }>) {
  const [workspace, dispatch] = useReducer(
    workspaceReducer,
    session,
    createFixtureWorkspace,
  );
  const [guidance, setGuidance] = useState<GuidanceState>({ status: 'idle' });
  const [note, setNote] = useState('');
  const [provider, setProvider] = useState<GuidanceProvider>('openai');
  const active = workspace.state === 'capturing';

  function addNote() {
    dispatch({ type: 'add-note', body: note });
    setNote('');
  }

  async function requestGuidance() {
    setGuidance({ status: 'loading' });
    try {
      const response = await fetch('/api/guidance', {
        body: JSON.stringify({
          mode: session.mode,
          notes: workspace.notes,
          provider,
          title: session.title,
          transcript: workspace.transcript.map((item) => ({
            speaker: item.speaker,
            text: item.text,
            timestamp: item.timestamp,
          })),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = (await response.json()) as {
        error?: unknown;
        provider?: unknown;
        text?: unknown;
      };
      if (
        !response.ok ||
        typeof payload.text !== 'string' ||
        (payload.provider !== 'openai' && payload.provider !== 'gemini')
      ) {
        setGuidance({
          message:
            typeof payload.error === 'string'
              ? payload.error
              : 'Unable to generate guidance.',
          status: 'error',
        });
        return;
      }
      setGuidance({
        provider: payload.provider,
        status: 'ready',
        text: payload.text,
      });
    } catch {
      setGuidance({
        message:
          'Unable to generate guidance. Check your connection and try again.',
        status: 'error',
      });
    }
  }

  return (
    <section aria-label="Session workspace" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
        <Card className="xl:order-1">
          <CardHeader>
            <CardTitle>Session control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
              This visible fixture does not access your microphone, system
              audio, or browser tabs. Guidance is sent only after you request
              it.
            </p>
            <label className="flex gap-3 text-sm leading-6">
              <input
                aria-label="Consent has been obtained"
                checked={workspace.consentAcknowledged}
                className="mt-1 size-4 accent-[var(--cl-color-primary)]"
                onChange={() => dispatch({ type: 'acknowledge-consent' })}
                type="checkbox"
              />
              I confirm every participant has consented to this visible fixture
              session.
            </label>
            <Button
              disabled={
                !workspace.consentAcknowledged || workspace.state !== 'idle'
              }
              onClick={() => dispatch({ type: 'start-fixture' })}
              type="button"
            >
              Start fixture session
            </Button>
            {active ? (
              <Button
                onClick={() => dispatch({ type: 'pause-fixture' })}
                type="button"
                variant="secondary"
              >
                Pause
              </Button>
            ) : null}
            {workspace.state === 'interrupted' ? (
              <Button
                onClick={() => dispatch({ type: 'resume-fixture' })}
                type="button"
              >
                Resume
              </Button>
            ) : null}
            {active || workspace.state === 'interrupted' ? (
              <Button
                onClick={() => dispatch({ type: 'stop-fixture' })}
                type="button"
                variant="ghost"
              >
                End fixture session
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6 xl:order-2">
          <CaptureIndicator
            {...(active ? { elapsedSeconds: 42 } : {})}
            sources={[]}
            state={
              workspace.state === 'capturing'
                ? 'capturing'
                : workspace.state === 'interrupted'
                  ? 'interrupted'
                  : 'idle'
            }
          />
          <Card>
            <CardHeader>
              <CardTitle>Conversation timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {workspace.transcript.length ? (
                <ol className="space-y-4">
                  {workspace.transcript.map((item) => (
                    <li
                      className="border-l-2 border-[var(--cl-color-border)] pl-4"
                      key={item.id}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--cl-color-muted-foreground)]">
                        {item.speaker} - {item.timestamp}
                      </p>
                      <p className="mt-1 leading-6">{item.text}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
                  Start the visible fixture to review a sample conversation.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="xl:order-3">
          <CardHeader>
            <CardTitle>Context and notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facilitator-note">Facilitator note</Label>
              <textarea
                className="min-h-28 w-full rounded-[var(--cl-radius-control)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)]"
                id="facilitator-note"
                onChange={(event) => setNote(event.target.value)}
                value={note}
              />
            </div>
            <Button onClick={addNote} type="button" variant="secondary">
              Add note
            </Button>
            {workspace.notes.length ? (
              <ul className="space-y-2 text-sm">
                {workspace.notes.map((item) => (
                  <li
                    className="rounded-[var(--cl-radius-control)] bg-[var(--cl-color-muted)] p-3"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="border-t border-[var(--cl-color-border)] pt-4">
              <Label htmlFor="guidance-provider">Guidance provider</Label>
              <select
                className="mt-2 min-h-11 w-full rounded-[var(--cl-radius-control)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)]"
                id="guidance-provider"
                onChange={(event) =>
                  setProvider(event.target.value as GuidanceProvider)
                }
                value={provider}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
              <Button
                className="mt-3"
                disabled={
                  guidance.status === 'loading' ||
                  workspace.transcript.length === 0
                }
                onClick={requestGuidance}
                type="button"
              >
                {guidance.status === 'loading'
                  ? 'Generating guidance...'
                  : 'Generate guidance'}
              </Button>
              <p className="mt-3 text-xs leading-5 text-[var(--cl-color-muted-foreground)]">
                This sends the visible transcript and saved notes only. It never
                makes a final interview decision.
              </p>
              {guidance.status === 'error' ? (
                <p
                  className="mt-3 text-sm text-[var(--cl-color-destructive)]"
                  role="alert"
                >
                  {guidance.message}
                </p>
              ) : null}
              {guidance.status === 'ready' ? (
                <div className="mt-4 rounded-[var(--cl-radius-control)] bg-[var(--cl-color-accent)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--cl-color-accent-foreground)]">
                    {guidanceLabelForMode(session.mode)} - {guidance.provider}
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    {normalizeGuidanceText(guidance.text)}
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
