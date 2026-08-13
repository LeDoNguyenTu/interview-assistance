import type { SessionRecord } from '@candorlens/core';

export type LiveSessionStatus =
  'setup' | 'ready' | 'capturing' | 'interrupted' | 'finished' | 'failed';

export type LiveTranscriptItem = {
  id: string;
  speaker: 'Interviewer' | 'Participant';
  text: string;
  timestamp: string;
  partial: boolean;
};

export type LiveSessionState = {
  activeSources: Array<'microphone' | 'browser-tab'>;
  error: string | null;
  notes: string[];
  session: SessionRecord;
  status: LiveSessionStatus;
  transcript: LiveTranscriptItem[];
};

export type LiveSessionEvent =
  | { type: 'sources-prepared'; sources: Array<'microphone' | 'browser-tab'> }
  | { type: 'capture-started' }
  | { type: 'capture-stopped' }
  | { type: 'capture-interrupted' }
  | { message: string; type: 'capture-failed' }
  | { body: string; type: 'add-note' };

export function createLiveSessionState(
  session: SessionRecord,
): LiveSessionState {
  return {
    activeSources: [],
    error: null,
    notes: [],
    session,
    status: 'setup',
    transcript: [],
  };
}

function fixtureTranscript(sessionId: string): LiveTranscriptItem {
  return {
    id: `${sessionId}-fixture-question-1`,
    partial: false,
    speaker: 'Interviewer',
    text: 'Tell me about a challenging project.',
    timestamp: '00:04',
  };
}

export function reduceLiveSession(
  state: LiveSessionState,
  event: LiveSessionEvent,
): LiveSessionState {
  switch (event.type) {
    case 'sources-prepared':
      return {
        ...state,
        activeSources: event.sources,
        error: null,
        status: 'ready',
      };
    case 'capture-started':
      return {
        ...state,
        error: null,
        status: 'capturing',
        transcript:
          state.session.providerId === 'fixture'
            ? [fixtureTranscript(state.session.id)]
            : state.transcript,
      };
    case 'capture-stopped':
      return { ...state, activeSources: [], error: null, status: 'finished' };
    case 'capture-interrupted':
      return {
        ...state,
        activeSources: [],
        error:
          'The selected browser source ended. Review setup before reconnecting.',
        status: 'interrupted',
      };
    case 'capture-failed':
      return {
        ...state,
        activeSources: [],
        error: event.message,
        status: 'failed',
      };
    case 'add-note': {
      const note = event.body.trim();
      return note ? { ...state, notes: [...state.notes, note] } : state;
    }
  }
}
