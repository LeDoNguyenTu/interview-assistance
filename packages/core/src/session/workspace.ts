import type { SessionRecord } from './schema.js';

export type WorkspaceCaptureState = 'idle' | 'capturing' | 'interrupted' | 'completed';

export interface WorkspaceTranscriptItem {
  id: string;
  speaker: 'Interviewer' | 'Participant';
  text: string;
  timestamp: string;
}

export interface WorkspaceState {
  consentAcknowledged: boolean;
  notes: string[];
  sessionId: string;
  state: WorkspaceCaptureState;
  transcript: WorkspaceTranscriptItem[];
}

export type WorkspaceEvent =
  | { type: 'acknowledge-consent' }
  | { type: 'start-fixture' }
  | { type: 'pause-fixture' }
  | { type: 'resume-fixture' }
  | { type: 'stop-fixture' }
  | { type: 'add-note'; body: string };

const fixtureTranscript: WorkspaceTranscriptItem[] = [
  {
    id: 'fixture-question-1',
    speaker: 'Interviewer',
    text: 'Tell me about a decision where you balanced speed and quality.',
    timestamp: '00:18',
  },
  {
    id: 'fixture-answer-1',
    speaker: 'Participant',
    text: 'I clarified the risk, chose a reversible path, and set a review point.',
    timestamp: '00:42',
  },
];

export function createFixtureWorkspace(session: SessionRecord): WorkspaceState {
  return {
    consentAcknowledged: false,
    notes: [],
    sessionId: session.id,
    state: 'idle',
    transcript: [],
  };
}

export function reduceWorkspace(
  state: WorkspaceState,
  event: WorkspaceEvent,
): WorkspaceState {
  switch (event.type) {
    case 'acknowledge-consent':
      return { ...state, consentAcknowledged: true };
    case 'start-fixture':
      return state.consentAcknowledged && state.state === 'idle'
        ? { ...state, state: 'capturing', transcript: fixtureTranscript }
        : state;
    case 'pause-fixture':
      return state.state === 'capturing' ? { ...state, state: 'interrupted' } : state;
    case 'resume-fixture':
      return state.state === 'interrupted' ? { ...state, state: 'capturing' } : state;
    case 'stop-fixture':
      return state.state === 'capturing' || state.state === 'interrupted'
        ? { ...state, state: 'completed' }
        : state;
    case 'add-note': {
      const body = event.body.trim();
      return body ? { ...state, notes: [...state.notes, body] } : state;
    }
  }
}
