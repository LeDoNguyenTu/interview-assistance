import type { ProviderId } from '@candorlens/core';

import {
  normalizeProviderError,
  type ProviderErrorCode,
  type ProviderOperation,
} from '../contracts/errors.js';
import type {
  GuidanceProvider,
  GuidanceRequest,
  GuidanceResult,
} from '../contracts/guidance.js';
import type {
  DetectedQuestion,
  QuestionDetector,
} from '../contracts/questions.js';
import type {
  TranscriptSegment,
  TranscriptionConnectionState,
  TranscriptionEvents,
  TranscriptionProvider,
} from '../contracts/transcription.js';

type EventListener<EventName extends keyof TranscriptionEvents> = (
  event: TranscriptionEvents[EventName],
) => void;

const fixtureId: ProviderId = 'fixture';

export class FixtureProvider
  implements GuidanceProvider, QuestionDetector, TranscriptionProvider
{
  readonly id = fixtureId;

  #listeners = new Map<
    keyof TranscriptionEvents,
    Set<(event: unknown) => void>
  >();
  #sessionId: string | null = null;
  #state: TranscriptionConnectionState = 'idle';
  #sequence = 0;

  async generateGuidance(request: GuidanceRequest): Promise<GuidanceResult> {
    this.#throwIfAborted(request.signal, 'generateGuidance');
    if (
      request.sessionId.trim().length === 0 ||
      request.question.sessionId !== request.sessionId ||
      request.question.id.trim().length === 0 ||
      request.question.text.trim().length === 0
    ) {
      this.#fail('generateGuidance', 'invalid_request');
    }

    await Promise.resolve();
    this.#throwIfAborted(request.signal, 'generateGuidance');

    return {
      requestId: `fixture-guidance-${request.question.id}`,
      summary: 'Use a concise and truthful example from your experience.',
      talkingPoints: [
        'State the situation and your responsibility.',
        'Explain the action you personally took.',
        'Close with a measurable result or lesson.',
      ],
      cautions: ['Do not claim experience or results that are not yours.'],
      followUps: [
        'What trade-off did you make?',
        'How would you approach it differently now?',
      ],
      providerId: this.id,
      model: 'fixture-deterministic-v1',
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  async detect(segments: TranscriptSegment[]): Promise<DetectedQuestion[]> {
    if (
      segments.some(
        (segment) =>
          segment.id.trim().length === 0 ||
          segment.sessionId.trim().length === 0,
      )
    ) {
      this.#fail('detectQuestions', 'invalid_request');
    }

    return segments
      .filter((segment) => segment.isFinal && segment.text.trim().endsWith('?'))
      .map((segment) => ({
        id: `fixture-question-${segment.id}`,
        sessionId: segment.sessionId,
        sourceSegmentIds: [segment.id],
        text: segment.text,
        context: 'Fixture question detected from transcript.',
        detectedAtMs: segment.endedAtMs,
        confidence: 0.98,
      }));
  }

  async connect(request: {
    sessionId: string;
    signal?: AbortSignal;
  }): Promise<void> {
    this.#throwIfAborted(request.signal, 'connect');
    if (request.sessionId.trim().length === 0 || this.#state !== 'idle') {
      this.#fail('connect', 'invalid_request');
    }

    this.#sessionId = request.sessionId;
    this.#emitState('connecting');
    await Promise.resolve();
    this.#throwIfAborted(request.signal, 'connect');
    this.#emitState('connected');
  }

  async sendAudio(audio: Uint8Array, signal?: AbortSignal): Promise<void> {
    this.#throwIfAborted(signal, 'sendAudio');
    if (
      this.#state !== 'connected' ||
      audio.byteLength === 0 ||
      this.#sessionId === null
    ) {
      this.#fail('sendAudio', 'invalid_request');
    }

    await Promise.resolve();
    this.#throwIfAborted(signal, 'sendAudio');

    this.#sequence += 1;
    const segment = this.#fixtureSegment(this.#sequence, false);
    this.#emit('transcriptDelta', { segment });
    this.#emit('transcriptFinal', {
      segment: {
        ...segment,
        text: 'Tell me about a challenging project?',
        isFinal: true,
        confidence: 0.98,
      },
    });
    this.#emit('usage', { inputAudioBytes: audio.byteLength });
  }

  async finish(signal?: AbortSignal): Promise<void> {
    this.#throwIfAborted(signal, 'finish');
    if (this.#state !== 'connected') {
      this.#fail('finish', 'invalid_request');
    }

    this.#emitState('finishing');
    await Promise.resolve();
    this.#throwIfAborted(signal, 'finish');
    this.#emitState('finished');
  }

  async close(): Promise<void> {
    if (this.#state === 'closed') {
      return;
    }

    this.#emitState('closed');
  }

  subscribe<EventName extends keyof TranscriptionEvents>(
    eventName: EventName,
    listener: EventListener<EventName>,
  ): () => void {
    const listeners =
      this.#listeners.get(eventName) ?? new Set<(event: unknown) => void>();
    const storedListener = listener as unknown as (event: unknown) => void;
    listeners.add(storedListener);
    this.#listeners.set(eventName, listeners);

    return () => listeners.delete(storedListener);
  }

  #fixtureSegment(sequence: number, isFinal: boolean): TranscriptSegment {
    return {
      id: `fixture-${this.#sessionId}-${sequence}`,
      sessionId: this.#sessionId ?? '',
      sequence,
      speaker: 'interviewer',
      text: 'Tell me about a challenging project',
      startedAtMs: (sequence - 1) * 2_500,
      endedAtMs: sequence * 2_500,
      isFinal,
      confidence: null,
    };
  }

  #emitState(state: TranscriptionConnectionState): void {
    this.#state = state;
    this.#emit('connectionState', { state });
  }

  #emit<EventName extends keyof TranscriptionEvents>(
    eventName: EventName,
    event: TranscriptionEvents[EventName],
  ): void {
    const listeners = this.#listeners.get(eventName);
    if (listeners === undefined) {
      return;
    }

    for (const listener of listeners) {
      listener(event);
    }
  }

  #throwIfAborted(
    signal: AbortSignal | undefined,
    operation: ProviderOperation,
  ): void {
    if (signal?.aborted) {
      this.#fail(operation, 'cancelled');
    }
  }

  #fail(operation: ProviderOperation, code: ProviderErrorCode): never {
    const error = normalizeProviderError({
      code,
      providerId: this.id,
      retryable: false,
      operation,
    });
    this.#emit('error', error);
    throw error;
  }
}
