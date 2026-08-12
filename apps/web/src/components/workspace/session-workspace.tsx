'use client';

import {
  createFixtureWorkspace,
  reduceWorkspace,
  type SessionRecord,
} from '@candorlens/core';
import { Button, CaptureIndicator, Card, CardContent, CardHeader, CardTitle, Label } from '@candorlens/ui';
import { useReducer, useState } from 'react';

function workspaceReducer(
  state: ReturnType<typeof createFixtureWorkspace>,
  event: Parameters<typeof reduceWorkspace>[1],
) {
  return reduceWorkspace(state, event);
}

export function SessionWorkspace({ session }: Readonly<{ session: SessionRecord }>) {
  const [workspace, dispatch] = useReducer(workspaceReducer, session, createFixtureWorkspace);
  const [note, setNote] = useState('');
  const active = workspace.state === 'capturing';

  function addNote() {
    dispatch({ type: 'add-note', body: note });
    setNote('');
  }

  return (
    <section className="space-y-6" aria-label="Session workspace">
      <div className="grid gap-6 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
        <Card className="xl:order-1">
          <CardHeader><CardTitle>Session control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
              This is a visible fixture demonstration. It does not access your microphone, system audio, browser tabs, or any provider.
            </p>
            <label className="flex gap-3 text-sm leading-6">
              <input aria-label="Consent has been obtained" checked={workspace.consentAcknowledged} className="mt-1 size-4 accent-[var(--cl-color-primary)]" onChange={() => dispatch({ type: 'acknowledge-consent' })} type="checkbox" />
              I confirm every participant has consented to this visible fixture session.
            </label>
            <Button disabled={!workspace.consentAcknowledged || workspace.state !== 'idle'} onClick={() => dispatch({ type: 'start-fixture' })} type="button">Start fixture session</Button>
            {active ? <Button onClick={() => dispatch({ type: 'pause-fixture' })} type="button" variant="secondary">Pause</Button> : null}
            {workspace.state === 'interrupted' ? <Button onClick={() => dispatch({ type: 'resume-fixture' })} type="button">Resume</Button> : null}
            {active || workspace.state === 'interrupted' ? <Button onClick={() => dispatch({ type: 'stop-fixture' })} type="button" variant="ghost">End fixture session</Button> : null}
          </CardContent>
        </Card>
        <div className="space-y-6 xl:order-2">
          <CaptureIndicator {...(active ? { elapsedSeconds: 42 } : {})} sources={[]} state={workspace.state === 'capturing' ? 'capturing' : workspace.state === 'interrupted' ? 'interrupted' : 'idle'} />
          <Card>
            <CardHeader><CardTitle>Conversation timeline</CardTitle></CardHeader>
            <CardContent>
              {workspace.transcript.length ? <ol className="space-y-4">{workspace.transcript.map((item) => <li className="border-l-2 border-[var(--cl-color-border)] pl-4" key={item.id}><p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--cl-color-muted-foreground)]">{item.speaker} · {item.timestamp}</p><p className="mt-1 leading-6">{item.text}</p></li>)}</ol> : <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">Start the visible fixture to review a sample conversation.</p>}
            </CardContent>
          </Card>
        </div>
        <Card className="xl:order-3">
          <CardHeader><CardTitle>Context and notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="facilitator-note">Facilitator note</Label><textarea className="min-h-28 w-full rounded-[var(--cl-radius-control)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)]" id="facilitator-note" onChange={(event) => setNote(event.target.value)} value={note} /></div>
            <Button onClick={addNote} type="button" variant="secondary">Add note</Button>
            {workspace.notes.length ? <ul className="space-y-2 text-sm">{workspace.notes.map((item) => <li className="rounded-[var(--cl-radius-control)] bg-[var(--cl-color-muted)] p-3" key={item}>{item}</li>)}</ul> : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
