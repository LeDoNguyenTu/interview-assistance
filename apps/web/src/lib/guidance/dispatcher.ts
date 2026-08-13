import 'server-only';

import { normalizeGuidanceText } from './presentation';

type Provider = 'gemini' | 'openai';

export interface GuidanceInput {
  mode: 'coach' | 'defense' | 'interviewer';
  notes: string[];
  provider: Provider;
  sessionId: string;
  title: string;
  transcript: Array<{
    speaker: 'Interviewer' | 'Participant';
    text: string;
    timestamp: string;
  }>;
}

export interface GuidanceResult {
  provider: Provider;
  text: string;
}

export class GuidanceDispatcherError extends Error {
  constructor(
    readonly code: 'invalid_input' | 'not_configured' | 'provider_failed',
  ) {
    super(
      code === 'not_configured'
        ? 'The selected provider is not configured.'
        : code === 'invalid_input'
          ? 'The guidance request is invalid.'
          : 'The provider could not generate guidance.',
    );
    this.name = 'GuidanceDispatcherError';
  }
}

type Dependencies = {
  env: Record<string, string | undefined>;
  fetchImpl: typeof fetch;
};

const maxItems = 12;
const maxCharacters = 12_000;

function promptFor(input: GuidanceInput): string {
  return [
    `Session title: ${input.title}`,
    `Mode: ${input.mode}`,
    'Visible transcript in chronological order, with the most recent turn last:',
    ...input.transcript.map(
      (item) => `[${item.timestamp}] ${item.speaker}: ${item.text}`,
    ),
    'Facilitator notes:',
    ...input.notes.map((note) => `- ${note}`),
  ].join('\n');
}

function instructionsFor(mode: GuidanceInput['mode']): string {
  const task =
    mode === 'coach'
      ? 'Return exactly one direct, speakable response to the latest interviewer question. Write in first person using the participant context that is actually available. If the latest question is a technical check, answer it naturally in one short sentence. Do not summarize the session and do not create a reflection prompt.'
      : mode === 'interviewer'
        ? 'Return exactly one fair follow-up question grounded in the latest participant answer. Ask for useful evidence or clarification without leading the participant.'
        : 'Return one concise evidence check that identifies a missing fact or unsupported inference, followed by one fair follow-up question.';

  return `${task} Return plain text only. Do not use Markdown, headings, labels, preambles, or commentary about the task. Never make a hiring decision, rank a person, or recommend hire or no-hire.`;
}

function validInput(input: GuidanceInput): boolean {
  const values = [
    input.sessionId,
    input.title,
    ...input.notes,
    ...input.transcript.flatMap((item) => [
      item.speaker,
      item.text,
      item.timestamp,
    ]),
  ];
  return (
    input.transcript.length <= maxItems &&
    input.notes.length <= maxItems &&
    values.every(
      (value) => typeof value === 'string' && value.trim().length > 0,
    ) &&
    values.join('').length <= maxCharacters
  );
}

async function responseJson(response: Response): Promise<unknown> {
  if (!response.ok) throw new GuidanceDispatcherError('provider_failed');
  return response.json();
}

function textFromOpenAI(payload: unknown): string | null {
  return typeof (payload as { output_text?: unknown }).output_text === 'string'
    ? (payload as { output_text: string }).output_text.trim() || null
    : null;
}

function textFromGemini(payload: unknown): string | null {
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

export async function generateGuidance(
  input: GuidanceInput,
  dependencies: Dependencies = { env: process.env, fetchImpl: fetch },
): Promise<GuidanceResult> {
  if (!validInput(input)) throw new GuidanceDispatcherError('invalid_input');

  if (input.provider === 'openai') {
    const key = dependencies.env.OPENAI_API_KEY;
    const model = dependencies.env.OPENAI_TEXT_MODEL;
    if (!key || !model) throw new GuidanceDispatcherError('not_configured');
    const payload = await responseJson(
      await dependencies.fetchImpl('https://api.openai.com/v1/responses', {
        body: JSON.stringify({
          input: promptFor(input),
          instructions: instructionsFor(input.mode),
          max_output_tokens: 180,
          model,
          store: false,
        }),
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    );
    const text = textFromOpenAI(payload);
    if (!text) throw new GuidanceDispatcherError('provider_failed');
    return { provider: 'openai', text: normalizeGuidanceText(text) };
  }

  const key = dependencies.env.GEMINI_API_KEY;
  const model = dependencies.env.GEMINI_TEXT_MODEL;
  if (!key || !model) throw new GuidanceDispatcherError('not_configured');
  const payload = await responseJson(
    await dependencies.fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptFor(input) }], role: 'user' }],
          generationConfig: { maxOutputTokens: 180, temperature: 0.2 },
          systemInstruction: { parts: [{ text: instructionsFor(input.mode) }] },
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    ),
  );
  const text = textFromGemini(payload);
  if (!text) throw new GuidanceDispatcherError('provider_failed');
  return { provider: 'gemini', text: normalizeGuidanceText(text) };
}
