import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  GuidanceDispatcherError,
  generateGuidance,
  type GuidanceInput,
} from './dispatcher';

const input: GuidanceInput = {
  mode: 'interviewer',
  notes: ['Probe the trade-off behind the answer.'],
  provider: 'openai',
  sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  title: 'Product interview',
  transcript: [
    {
      speaker: 'Interviewer',
      text: 'Tell me about a time you balanced speed and quality.',
      timestamp: '00:18',
    },
  ],
};

describe('generateGuidance', () => {
  it('sends an explicit no-store OpenAI request and returns its text', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ output_text: 'Ask how they measured risk.' }),
          { status: 200 },
        ),
      );

    const result = await generateGuidance(input, {
      env: { OPENAI_API_KEY: 'test-key', OPENAI_TEXT_MODEL: 'test-model' },
      fetchImpl,
    });

    expect(result).toEqual({
      provider: 'openai',
      text: 'Ask how they measured risk.',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        method: 'POST',
      }),
    );
    const body = fetchImpl.mock.calls[0]?.[1]?.body;
    expect(JSON.parse(typeof body === 'string' ? body : '')).toMatchObject({
      model: 'test-model',
      store: false,
    });
  });

  it('extracts text from Gemini content candidates', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: 'Ask about the decision constraint.' }],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await generateGuidance(
      { ...input, provider: 'gemini' },
      {
        env: { GEMINI_API_KEY: 'test-key', GEMINI_TEXT_MODEL: 'test-model' },
        fetchImpl,
      },
    );

    expect(result).toEqual({
      provider: 'gemini',
      text: 'Ask about the decision constraint.',
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toContain(
      'models/test-model:generateContent?key=test-key',
    );
  });

  it('rejects a request when its configured provider key is absent', async () => {
    await expect(
      generateGuidance(input, { env: {}, fetchImpl: vi.fn() }),
    ).rejects.toMatchObject({
      code: 'not_configured',
      name: GuidanceDispatcherError.name,
    });
  });

  it('rejects transcripts over the visible request limit before calling a provider', async () => {
    const fetchImpl = vi.fn();
    await expect(
      generateGuidance(
        {
          ...input,
          transcript: Array.from({ length: 13 }, () => input.transcript[0]!),
        },
        {
          env: { OPENAI_API_KEY: 'test-key', OPENAI_TEXT_MODEL: 'test-model' },
          fetchImpl,
        },
      ),
    ).rejects.toMatchObject({ code: 'invalid_input' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
