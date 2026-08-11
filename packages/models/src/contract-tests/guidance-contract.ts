import { describe, expect, it } from 'vitest';

import type { GuidanceProvider, GuidanceRequest } from '../index.js';

export type GuidanceProviderFactory = () => GuidanceProvider;

export function runGuidanceProviderContract(
  createProvider: GuidanceProviderFactory,
): void {
  describe('GuidanceProvider contract', () => {
    it('returns a complete result that identifies its provider', async () => {
      const provider = createProvider();

      const result = await provider.generateGuidance(guidanceRequest());

      expect(result).toMatchObject({
        requestId: expect.any(String),
        summary: expect.any(String),
        talkingPoints: expect.any(Array),
        cautions: expect.any(Array),
        followUps: expect.any(Array),
        providerId: provider.id,
        model: expect.any(String),
        usage: {
          inputTokens: expect.toSatisfy(
            (value: unknown) => value === null || typeof value === 'number',
          ),
          outputTokens: expect.toSatisfy(
            (value: unknown) => value === null || typeof value === 'number',
          ),
        },
      });
    });

    it('rejects a request whose question belongs to another session', async () => {
      const provider = createProvider();
      const request = guidanceRequest({
        question: {
          ...guidanceRequest().question,
          sessionId: 'another-session',
        },
      });

      await expect(provider.generateGuidance(request)).rejects.toMatchObject({
        name: 'ProviderError',
        code: 'invalid_request',
        providerId: provider.id,
        retryable: false,
        operation: 'generateGuidance',
      });
    });

    it('rejects a cancelled request with a normalized error', async () => {
      const provider = createProvider();
      const controller = new AbortController();
      controller.abort();

      await expect(
        provider.generateGuidance(
          guidanceRequest({ signal: controller.signal }),
        ),
      ).rejects.toMatchObject({
        name: 'ProviderError',
        code: 'cancelled',
        providerId: provider.id,
        retryable: false,
        operation: 'generateGuidance',
      });
    });
  });
}

function guidanceRequest(
  overrides: Partial<GuidanceRequest> = {},
): GuidanceRequest {
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
    recentTranscript: [
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
    ],
    profileContext: ['Built a billing reconciliation workflow.'],
    ...overrides,
  };
}
