import type { ProviderId } from '@candorlens/core';

import type { ProviderError } from './errors.js';

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  sequence: number;
  speaker: 'interviewer' | 'interviewee' | 'unknown';
  text: string;
  startedAtMs: number;
  endedAtMs: number;
  isFinal: boolean;
  confidence: number | null;
}

export type TranscriptionConnectionState =
  'idle' | 'connecting' | 'connected' | 'finishing' | 'finished' | 'closed';

export interface TranscriptionConnectRequest {
  sessionId: string;
  signal?: AbortSignal;
}

export interface TranscriptionUsage {
  inputAudioBytes: number | null;
}

export interface TranscriptionEvents {
  connectionState: { state: TranscriptionConnectionState };
  transcriptDelta: { segment: TranscriptSegment };
  transcriptFinal: { segment: TranscriptSegment };
  usage: TranscriptionUsage;
  error: ProviderError;
}

export interface TranscriptionProvider {
  readonly id: ProviderId;
  connect(request: TranscriptionConnectRequest): Promise<void>;
  sendAudio(audio: Uint8Array, signal?: AbortSignal): Promise<void>;
  finish(signal?: AbortSignal): Promise<void>;
  close(): Promise<void>;
  subscribe<EventName extends keyof TranscriptionEvents>(
    eventName: EventName,
    listener: (event: TranscriptionEvents[EventName]) => void,
  ): () => void;
}
