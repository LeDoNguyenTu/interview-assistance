import 'server-only';

import type { ConfigurableProvider } from '../../data/provider-credentials/input';

type TranscriptionInput = {
  audio: Uint8Array;
  mimeType: string;
  provider: ConfigurableProvider;
};

type Dependencies = {
  env: Readonly<Record<string, string | undefined>>;
  fetchImpl: typeof fetch;
};

export class TranscriptionDispatcherError extends Error {
  constructor(readonly code: 'not_configured' | 'provider_failed') {
    super(
      code === 'not_configured'
        ? 'The selected transcription provider is not configured.'
        : 'The audio provider could not transcribe this segment.',
    );
    this.name = 'TranscriptionDispatcherError';
  }
}

function geminiText(payload: unknown): string | null {
  const parts = (
    payload as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
    }
  ).candidates?.[0]?.content?.parts;
  const text = parts
    ?.map((part) => part.text)
    .filter((item): item is string => typeof item === 'string')
    .join('')
    .trim();
  return text || null;
}

export async function transcribeAudio(
  input: TranscriptionInput,
  dependencies: Dependencies = { env: process.env, fetchImpl: fetch },
): Promise<{ provider: ConfigurableProvider; text: string }> {
  if (input.provider === 'openai') {
    const key = dependencies.env.OPENAI_API_KEY;
    if (!key) throw new TranscriptionDispatcherError('not_configured');

    const form = new FormData();
    form.set('model', 'gpt-4o-mini-transcribe');
    const extension = input.mimeType.startsWith('audio/mp4') ? 'mp4' : 'webm';
    form.set(
      'file',
      new Blob([new Uint8Array(input.audio).buffer], { type: input.mimeType }),
      `live-segment.${extension}`,
    );
    const response = await dependencies.fetchImpl(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        body: form,
        headers: { Authorization: `Bearer ${key}` },
        method: 'POST',
      },
    );
    if (!response.ok) {
      throw new TranscriptionDispatcherError('provider_failed');
    }
    const payload = (await response.json()) as { text?: unknown };
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!text) throw new TranscriptionDispatcherError('provider_failed');
    return { provider: 'openai', text };
  }

  const key = dependencies.env.GEMINI_API_KEY;
  const model = dependencies.env.GEMINI_TEXT_MODEL;
  if (!key || !model) {
    throw new TranscriptionDispatcherError('not_configured');
  }
  const response = await dependencies.fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  data: Buffer.from(input.audio).toString('base64'),
                  mime_type: input.mimeType,
                },
              },
              {
                text: 'Transcribe only the spoken words in this audio segment. Return plain text with no commentary.',
              },
            ],
          },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      method: 'POST',
    },
  );
  if (!response.ok) {
    throw new TranscriptionDispatcherError('provider_failed');
  }
  const text = geminiText(await response.json());
  if (!text) throw new TranscriptionDispatcherError('provider_failed');
  return { provider: 'gemini', text };
}
