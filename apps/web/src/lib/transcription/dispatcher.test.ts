import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { transcribeAudio, TranscriptionDispatcherError } from './dispatcher.js';

const audio = new Uint8Array([1, 2, 3, 4]);

describe('transcribeAudio', () => {
  it('sends a webm chunk to the OpenAI transcription endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'What changed after launch?' }), {
        status: 200,
      }),
    );

    await expect(
      transcribeAudio(
        { audio, mimeType: 'audio/webm', provider: 'openai' },
        {
          env: { OPENAI_API_KEY: 'owner-key' },
          fetchImpl,
        },
      ),
    ).resolves.toEqual({
      provider: 'openai',
      text: 'What changed after launch?',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.objectContaining({ method: 'POST' }),
    );
    const request = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(request.headers).toEqual({ Authorization: 'Bearer owner-key' });
    expect((request.body as FormData).get('model')).toBe(
      'gpt-4o-mini-transcribe',
    );
  });

  it('sends inline audio to the configured Gemini model', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: 'Tell me about the result.' }] } },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      transcribeAudio(
        { audio, mimeType: 'audio/webm', provider: 'gemini' },
        {
          env: {
            GEMINI_API_KEY: 'owner-key',
            GEMINI_TEXT_MODEL: 'gemini-2.5-flash',
          },
          fetchImpl,
        },
      ),
    ).resolves.toEqual({
      provider: 'gemini',
      text: 'Tell me about the result.',
    });

    const [url, request] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('gemini-2.5-flash:generateContent');
    const body = JSON.parse(request.body as string);
    expect(body.contents[0].parts[0].inline_data).toMatchObject({
      mime_type: 'audio/webm',
    });
  });

  it('returns a safe provider failure for empty responses', async () => {
    await expect(
      transcribeAudio(
        { audio, mimeType: 'audio/webm', provider: 'openai' },
        {
          env: { OPENAI_API_KEY: 'owner-key' },
          fetchImpl: vi
            .fn()
            .mockResolvedValue(new Response(JSON.stringify({ text: '' }))),
        },
      ),
    ).rejects.toBeInstanceOf(TranscriptionDispatcherError);
  });
});
