import { describe, expect, it } from 'vitest';

import {
  FixtureProvider,
  type GuidanceRequest,
  type TranscriptSegment,
} from '../index.js';
import { runGuidanceProviderContract } from '../testing.js';

runGuidanceProviderContract(() => new FixtureProvider());

function request(overrides: Partial<GuidanceRequest> = {}): GuidanceRequest {
  return {
    sessionId: 'session-1',
    mode: 'coach',
    question: {
      id: 'question-1',
      sessionId: 'session-1',
      sourceSegmentIds: ['segment-1'],
      text: 'Tell me about a challenging project?',
      context: 'The interviewer wants a concrete example.',
      detectedAtMs: 2_500,
      confidence: 0.95,
    },
    recentTranscript: [],
    profileContext: ['Built a billing reconciliation workflow.'],
    ...overrides,
  };
}

describe('FixtureProvider', () => {
  it('returns stable guidance for the same request', async () => {
    const provider = new FixtureProvider();

    await expect(provider.generateGuidance(request())).resolves.toEqual({
      requestId: 'fixture-guidance-question-1',
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
      providerId: 'fixture',
      model: 'fixture-deterministic-v1',
      usage: { inputTokens: 0, outputTokens: 0 },
    });
  });

  it('returns deterministic questions for final question segments', async () => {
    const provider = new FixtureProvider();

    await expect(
      provider.detect([
        {
          id: 'segment-1',
          sessionId: 'session-1',
          sequence: 1,
          speaker: 'interviewer',
          text: 'Tell me about a challenging project?',
          startedAtMs: 0,
          endedAtMs: 2_500,
          isFinal: true,
          confidence: 0.98,
        },
      ]),
    ).resolves.toEqual([
      {
        id: 'fixture-question-segment-1',
        sessionId: 'session-1',
        sourceSegmentIds: ['segment-1'],
        text: 'Tell me about a challenging project?',
        context: 'Fixture question detected from transcript.',
        detectedAtMs: 2_500,
        confidence: 0.98,
      },
    ]);
  });

  it('rejects mixed-session and malformed question detection input', async () => {
    const provider = new FixtureProvider();
    const segment: TranscriptSegment = {
      id: 'segment-1',
      sessionId: 'session-1',
      sequence: 1,
      speaker: 'interviewer',
      text: 'Tell me about a challenging project?',
      startedAtMs: 0,
      endedAtMs: 2_500,
      isFinal: true,
      confidence: 0.98,
    };

    for (const input of [
      [
        segment,
        { ...segment, id: 'segment-2', sessionId: 'session-2', sequence: 2 },
      ],
      [segment, { ...segment, id: 'segment-2', sequence: 1 }],
      [{ ...segment, startedAtMs: 2_501, endedAtMs: 2_500 }],
      [{ ...segment, confidence: 1.01 }],
    ]) {
      await expect(provider.detect(input)).rejects.toMatchObject({
        name: 'ProviderError',
        code: 'invalid_request',
        providerId: 'fixture',
        retryable: false,
        operation: 'detectQuestions',
        message: 'The request could not be processed.',
      });
    }
  });

  it('rejects a transcript segment with an unsupported speaker', async () => {
    const provider = new FixtureProvider();

    await expect(
      provider.detect([
        {
          id: 'segment-1',
          sessionId: 'session-1',
          sequence: 1,
          speaker: 'system' as unknown as TranscriptSegment['speaker'],
          text: 'Tell me about a challenging project?',
          startedAtMs: 0,
          endedAtMs: 2_500,
          isFinal: true,
          confidence: 0.98,
        },
      ]),
    ).rejects.toMatchObject({
      name: 'ProviderError',
      code: 'invalid_request',
      providerId: 'fixture',
      retryable: false,
      operation: 'detectQuestions',
      message: 'The request could not be processed.',
    });
  });

  it('rejects a transcript segment with non-boolean finality', async () => {
    const provider = new FixtureProvider();

    await expect(
      provider.detect([
        {
          id: 'segment-1',
          sessionId: 'session-1',
          sequence: 1,
          speaker: 'interviewer',
          text: 'Tell me about a challenging project?',
          startedAtMs: 0,
          endedAtMs: 2_500,
          isFinal: 'true' as unknown as boolean,
          confidence: 0.98,
        },
      ]),
    ).rejects.toMatchObject({
      name: 'ProviderError',
      code: 'invalid_request',
      providerId: 'fixture',
      retryable: false,
      operation: 'detectQuestions',
      message: 'The request could not be processed.',
    });
  });

  it('restores idle after connect cancellation so a new connection can be used', async () => {
    const provider = new FixtureProvider();
    const states: string[] = [];
    provider.subscribe('connectionState', (event) => states.push(event.state));
    const controller = new AbortController();

    const connecting = provider.connect({
      sessionId: 'session-1',
      signal: controller.signal,
    });
    controller.abort();

    await expect(connecting).rejects.toMatchObject({
      name: 'ProviderError',
      code: 'cancelled',
      operation: 'connect',
    });
    await expect(
      provider.connect({ sessionId: 'session-1' }),
    ).resolves.toBeUndefined();
    await expect(
      provider.sendAudio(new Uint8Array([1])),
    ).resolves.toBeUndefined();
    expect(states).toEqual(['connecting', 'idle', 'connecting', 'connected']);
  });

  it('restores connected after finish cancellation so processing can continue', async () => {
    const provider = new FixtureProvider();
    await provider.connect({ sessionId: 'session-1' });
    const controller = new AbortController();

    const finishing = provider.finish(controller.signal);
    controller.abort();

    await expect(finishing).rejects.toMatchObject({
      name: 'ProviderError',
      code: 'cancelled',
      operation: 'finish',
    });
    await expect(
      provider.sendAudio(new Uint8Array([1])),
    ).resolves.toBeUndefined();
    await expect(provider.finish()).resolves.toBeUndefined();
  });

  it('emits a deterministic transcript lifecycle', async () => {
    const provider = new FixtureProvider();
    const states: string[] = [];
    const deltas: TranscriptSegment[] = [];
    const finals: TranscriptSegment[] = [];
    const usage: unknown[] = [];
    const errors: unknown[] = [];

    provider.subscribe('connectionState', (event) => states.push(event.state));
    provider.subscribe('transcriptDelta', (event) =>
      deltas.push(event.segment),
    );
    provider.subscribe('transcriptFinal', (event) =>
      finals.push(event.segment),
    );
    provider.subscribe('usage', (event) => usage.push(event));
    provider.subscribe('error', (event) => errors.push(event));

    await provider.connect({ sessionId: 'session-1' });
    await provider.sendAudio(new Uint8Array([1, 2, 3, 4]));
    await provider.finish();
    await provider.close();

    expect(states).toEqual([
      'connecting',
      'connected',
      'finishing',
      'finished',
      'closed',
    ]);
    expect(deltas).toEqual([
      {
        id: 'fixture-session-1-1',
        sessionId: 'session-1',
        sequence: 1,
        speaker: 'interviewer',
        text: 'Tell me about a challenging project',
        startedAtMs: 0,
        endedAtMs: 2_500,
        isFinal: false,
        confidence: null,
      },
    ]);
    expect(finals).toEqual([
      {
        id: 'fixture-session-1-1',
        sessionId: 'session-1',
        sequence: 1,
        speaker: 'interviewer',
        text: 'Tell me about a challenging project?',
        startedAtMs: 0,
        endedAtMs: 2_500,
        isFinal: true,
        confidence: 0.98,
      },
    ]);
    expect(usage).toEqual([{ inputAudioBytes: 4 }]);
    expect(errors).toEqual([]);
  });

  it('rejects invalid audio with a safe normalized error event', async () => {
    const provider = new FixtureProvider();
    const errors: unknown[] = [];
    provider.subscribe('error', (event) => errors.push(event));
    await provider.connect({ sessionId: 'session-1' });

    await expect(provider.sendAudio(new Uint8Array())).rejects.toMatchObject({
      name: 'ProviderError',
      code: 'invalid_request',
      providerId: 'fixture',
      retryable: false,
      operation: 'sendAudio',
      message: 'The request could not be processed.',
    });
    expect(errors).toMatchObject([
      {
        code: 'invalid_request',
        providerId: 'fixture',
        retryable: false,
        operation: 'sendAudio',
        message: 'The request could not be processed.',
      },
    ]);
  });
});
