// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SessionRecord } from '@candorlens/core';
import { afterEach, describe, expect, it } from 'vitest';

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
      await screen.findByText('Tell me about a challenging project.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stop capture' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Capturing');
  });
});
