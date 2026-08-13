import type { SessionRecord } from '@candorlens/core';

export type LiveSessionStatus =
  'setup' | 'ready' | 'capturing' | 'interrupted' | 'finished' | 'failed';

export type LiveTranscriptItem = {
  confidence: number | null;
  endMs: number;
  id: string;
  sequence: number;
  speaker: 'Interviewer' | 'Participant';
  startMs: number;
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
  | { item: LiveTranscriptItem; type: 'transcript-finalized' }
  | { body: string; type: 'add-note' };

export function createLiveSessionState(
  session: SessionRecord,
  initial?: { notes?: string[]; transcript?: LiveTranscriptItem[] },
): LiveSessionState {
  return {
    activeSources: [],
    error: null,
    notes: initial?.notes ?? [],
    session,
    status: 'setup',
    transcript: initial?.transcript ?? [],
  };
}

function fixtureTranscript(sessionId: string): LiveTranscriptItem {
  return {
    confidence: 0.98,
    endMs: 4000,
    id: `${sessionId}-fixture-question-1`,
    partial: false,
    sequence: 0,
    speaker: 'Interviewer',
    startMs: 0,
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
          state.session.providerId === 'fixture' &&
          state.transcript.length === 0
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
    case 'transcript-finalized':
      return state.transcript.some((item) => item.id === event.item.id)
        ? state
        : {
            ...state,
            transcript: [...state.transcript, event.item].sort(
              (left, right) => left.sequence - right.sequence,
            ),
          };
    case 'add-note': {
      const note = event.body.trim();
      return note ? { ...state, notes: [...state.notes, note] } : state;
    }
  }
}
