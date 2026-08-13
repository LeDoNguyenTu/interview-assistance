// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { SessionRecord } from '@candorlens/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  BrowserCaptureController,
  BrowserCaptureSnapshot,
} from '../../capture/browser-capture-controller';
import { LiveSessionScreen } from './live-session-screen';

afterEach(cleanup);

const session: SessionRecord = {
  captureSources: [],
  consentedAt: null,
  createdAt: '2026-08-13T00:00:00.000Z',
  endedAt: null,
  id: 'session-1',
  mode: 'coach',
  ownerId: 'owner-1',
  providerId: 'fixture',
  startedAt: null,
  status: 'draft',
  title: 'Product interview',
  updatedAt: '2026-08-13T00:00:00.000Z',
};

function createController(): BrowserCaptureController {
  let snapshot: BrowserCaptureSnapshot = {
    activeSources: [],
    displayAudioAvailable: null,
    error: null,
    startedAtMs: null,
    status: 'idle',
  };
  const listeners = new Set<(next: BrowserCaptureSnapshot) => void>();
  const publish = (next: BrowserCaptureSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener(next));
    return next;
  };

  return {
    audioSources: () => [],
    dispose: async () => undefined,
    prepare: async (selection) =>
      publish({
        activeSources: selection.microphone ? ['microphone'] : ['browser-tab'],
        displayAudioAvailable: selection.displayAudio,
        error: null,
        startedAtMs: null,
        status: 'ready',
      }),
    snapshot: () => snapshot,
    start: async () =>
      publish({ ...snapshot, startedAtMs: 1, status: 'capturing' }),
    stop: async () =>
      publish({
        activeSources: [],
        displayAudioAvailable: snapshot.displayAudioAvailable,
        error: null,
        startedAtMs: null,
        status: 'stopped',
      }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

describe('LiveSessionScreen', () => {
  it('uses the full session frame for setup instead of a narrower floating panel', () => {
    render(
      <LiveSessionScreen
        capabilities={{
          audioWorklet: true,
          displayAudioRequested: true,
          displayMedia: true,
          microphone: true,
          secureContext: true,
        }}
        createCaptureController={createController}
        session={session}
      />,
    );

    const setup = screen.getByTestId('live-session-setup');
    expect(setup.className).toContain('w-full');
    expect(setup.className).not.toContain('max-w-3xl');
  });

  it('keeps setup visible, then shows persistent fixture capture status and an immediate stop control', async () => {
    render(
      <LiveSessionScreen
        capabilities={{
          audioWorklet: true,
          displayAudioRequested: true,
          displayMedia: true,
          microphone: true,
          secureContext: true,
        }}
        createCaptureController={createController}
        fetchImpl={vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ saved: true }), { status: 201 }),
          )}
        session={session}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(
      screen.getByRole('checkbox', { name: /participants have consented/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and choose sources' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Request browser permission' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Start visible capture' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Start visible capture' }),
    );

    expect(
      await screen.findAllByText('Tell me about a challenging project.'),
    ).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Stop capture' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Capturing');
  });

  it('sends only visible session context when the user requests guidance', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input: RequestInfo | URL) =>
      String(input) === '/api/guidance'
        ? new Response(
            JSON.stringify({
              provider: 'openai',
              text: '**Suggested Response:** *Name the trade-off you made.*',
            }),
            { status: 200 },
          )
        : new Response(JSON.stringify({ saved: true }), { status: 201 }),
    );

    render(
      <LiveSessionScreen
        capabilities={{
          audioWorklet: true,
          displayAudioRequested: true,
          displayMedia: true,
          microphone: true,
          secureContext: true,
        }}
        createCaptureController={createController}
        fetchImpl={fetchImpl}
        guidanceProviders={['openai']}
        session={session}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(
      screen.getByRole('checkbox', { name: /participants have consented/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and choose sources' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Request browser permission' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Start visible capture' }),
    );
    await screen.findAllByText('Tell me about a challenging project.');
    fireEvent.change(screen.getByLabelText('Private note'), {
      target: { value: 'Focus on the candidate’s own contribution.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate guidance' }));

    expect(
      await screen.findByText('Name the trade-off you made.'),
    ).toBeTruthy();
    const guidanceCall = fetchImpl.mock.calls.find(
      ([input]) => input === '/api/guidance',
    );
    expect(guidanceCall).toBeTruthy();
    const request = guidanceCall?.[1] as RequestInit;
    expect(JSON.parse(request.body as string)).toEqual({
      mode: 'coach',
      notes: ['Focus on the candidate’s own contribution.'],
      provider: 'openai',
      sessionId: 'session-1',
      title: 'Product interview',
      transcript: [
        {
          speaker: 'Interviewer',
          text: 'Tell me about a challenging project.',
          timestamp: '00:04',
        },
      ],
    });
    expect(screen.getByText('Suggested response')).toBeTruthy();
    expect(screen.queryByText(/Draft for human review/i)).toBeNull();
    expect(document.body.textContent).not.toContain('**');
  });

  it('persists final transcript events and private notes through the session event route', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ saved: true }), { status: 201 }),
      );

    render(
      <LiveSessionScreen
        capabilities={{
          audioWorklet: true,
          displayAudioRequested: true,
          displayMedia: true,
          microphone: true,
          secureContext: true,
        }}
        createCaptureController={createController}
        fetchImpl={fetchImpl}
        session={session}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(
      screen.getByRole('checkbox', { name: /participants have consented/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and choose sources' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Request browser permission' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Start visible capture' }),
    );

    await waitFor(() => {
      const hasUtterance = fetchImpl.mock.calls.some(([, init]) => {
        const body = JSON.parse((init as RequestInit).body as string) as {
          type?: string;
        };
        return body.type === 'utterance';
      });
      expect(hasUtterance).toBe(true);
    });
    const transcriptRequest = fetchImpl.mock.calls.find(([url, init]) => {
      const body = JSON.parse((init as RequestInit).body as string) as {
        type?: string;
      };
      return (
        url === '/api/sessions/session-1/events' && body.type === 'utterance'
      );
    })?.[1] as RequestInit;
    expect(JSON.parse(transcriptRequest.body as string)).toMatchObject({
      id: 'session-1-fixture-question-1',
      sequence: 0,
      speaker: 'interviewer',
      text: 'Tell me about a challenging project.',
      type: 'utterance',
    });

    fireEvent.change(screen.getByLabelText('Private note'), {
      target: { value: 'Ask for the measured outcome.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));

    await waitFor(() => {
      const noteCall = fetchImpl.mock.calls.find(([, init]) => {
        const body = JSON.parse((init as RequestInit).body as string) as {
          type?: string;
        };
        return body.type === 'note';
      });
      expect(noteCall).toBeTruthy();
    });
  });

  it('starts configured live transcription and renders each finalized segment', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ saved: true }), { status: 201 }),
      );
    const transcriptionController = {
      flush: vi.fn().mockResolvedValue(undefined),
      start: vi.fn(
        (_sources: readonly unknown[], onTranscript: (item: unknown) => void) =>
          onTranscript({
            confidence: null,
            endMs: 6000,
            id: 'live-segment-1',
            partial: false,
            sequence: 0,
            speaker: 'Interviewer',
            startMs: 0,
            text: 'How did you validate that result?',
            timestamp: '00:00',
          }),
      ),
      stop: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <LiveSessionScreen
        capabilities={{
          audioWorklet: true,
          displayAudioRequested: true,
          displayMedia: true,
          microphone: true,
          secureContext: true,
        }}
        createCaptureController={createController}
        createTranscriptionController={() => transcriptionController}
        fetchImpl={fetchImpl}
        session={{ ...session, providerId: 'openai' }}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(
      screen.getByRole('checkbox', { name: /participants have consented/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and choose sources' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Request browser permission' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Start visible capture' }),
    );

    expect(
      await screen.findAllByText('How did you validate that result?'),
    ).toHaveLength(2);
    expect(transcriptionController.start).toHaveBeenCalledOnce();
  });

  it('releases browser tracks when transcription startup fails', async () => {
    const controller = createController();
    const stop = vi.spyOn(controller, 'stop');
    render(
      <LiveSessionScreen
        capabilities={{
          audioWorklet: true,
          displayAudioRequested: true,
          displayMedia: true,
          microphone: true,
          secureContext: true,
        }}
        createCaptureController={() => controller}
        createTranscriptionController={() => ({
          flush: vi.fn().mockResolvedValue(undefined),
          start: () => {
            throw new Error('MediaRecorder unavailable');
          },
          stop: vi.fn().mockResolvedValue(undefined),
        })}
        fetchImpl={vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ saved: true }), { status: 201 }),
          )}
        session={{ ...session, providerId: 'openai' }}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(
      screen.getByRole('checkbox', { name: /participants have consented/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm and choose sources' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Request browser permission' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Start visible capture' }),
    );

    await waitFor(() => expect(stop).toHaveBeenCalledWith('error'));
    expect(await screen.findByText(/unable to start capture/i)).toBeTruthy();
  });
});
