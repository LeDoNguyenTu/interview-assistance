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
    const body = fetchImpl.mock.calls[0]?.[1]?.body;
    const request = JSON.parse(typeof body === 'string' ? body : '');
    expect(request.systemInstruction.parts[0].text).toContain(
      'Return exactly one fair follow-up question',
    );
    expect(request.systemInstruction.parts[0].text).toContain(
      'plain text only',
    );
    expect(request.systemInstruction.parts[0].text).not.toContain(
      'draft for human review',
    );
    expect(request.generationConfig).toMatchObject({
      maxOutputTokens: 180,
      temperature: 0.2,
    });
  });

  it('asks Coach mode for a direct speakable response instead of a summary', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: 'Yes, I can hear you clearly.' }],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await generateGuidance(
      {
        ...input,
        mode: 'coach',
        provider: 'gemini',
        transcript: [
          {
            speaker: 'Interviewer',
            text: 'Can you hear me talking?',
            timestamp: '00:04',
          },
        ],
      },
      {
        env: { GEMINI_API_KEY: 'test-key', GEMINI_TEXT_MODEL: 'test-model' },
        fetchImpl,
      },
    );

    const body = fetchImpl.mock.calls[0]?.[1]?.body;
    const request = JSON.parse(typeof body === 'string' ? body : '');
    expect(request.systemInstruction.parts[0].text).toContain(
      'direct, speakable response',
    );
    expect(request.systemInstruction.parts[0].text).toContain(
      'Do not summarize the session',
    );
    expect(request.systemInstruction.parts[0].text).toContain(
      'technical check',
    );
  });

  it('normalizes provider Markdown and review boilerplate before returning it', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '**Suggested Response:** *Yes, I can hear you clearly.*',
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      generateGuidance(
        { ...input, mode: 'coach', provider: 'gemini' },
        {
          env: { GEMINI_API_KEY: 'test-key', GEMINI_TEXT_MODEL: 'test-model' },
          fetchImpl,
        },
      ),
    ).resolves.toEqual({
      provider: 'gemini',
      text: 'Yes, I can hear you clearly.',
    });
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
