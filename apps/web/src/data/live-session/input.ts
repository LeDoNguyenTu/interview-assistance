export class LiveSessionEventInputError extends Error {
  constructor(message = 'Enter a valid live session event.') {
    super(message);
    this.name = 'LiveSessionEventInputError';
  }
}

type NoteEvent = {
  body: string;
  idempotencyKey: string;
  type: 'note';
};

type UtteranceEvent = {
  confidence: number | null;
  endMs: number;
  id: string;
  sequence: number;
  speaker: 'interviewer' | 'interviewee' | 'unknown';
  startMs: number;
  text: string;
  type: 'utterance';
};

type ConsentEvent = {
  sources: Array<'microphone' | 'browser-tab'>;
  type: 'consent';
};

export type LiveSessionEvent = ConsentEvent | NoteEvent | UtteranceEvent;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseIdentifier(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 160 ||
    !/^[A-Za-z0-9._:-]+$/.test(value)
  ) {
    throw new LiveSessionEventInputError();
  }
  return value;
}

function parseBoundedText(value: unknown, maximum: number): string {
  if (typeof value !== 'string') {
    throw new LiveSessionEventInputError();
  }
  const text = value.trim();
  if (text.length < 1 || text.length > maximum) {
    throw new LiveSessionEventInputError();
  }
  return text;
}

function parseNonNegativeInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new LiveSessionEventInputError();
  }
  return value as number;
}

export function parseLiveSessionEvent(input: unknown): LiveSessionEvent {
  if (!isRecord(input)) {
    throw new LiveSessionEventInputError();
  }

  if (input.type === 'note') {
    return {
      body: parseBoundedText(input.body, 4000),
      idempotencyKey: parseIdentifier(input.idempotencyKey),
      type: 'note',
    };
  }

  if (input.type === 'consent') {
    if (
      !Array.isArray(input.sources) ||
      input.sources.length < 1 ||
      input.sources.length > 2 ||
      input.sources.some(
        (source) => source !== 'microphone' && source !== 'browser-tab',
      ) ||
      new Set(input.sources).size !== input.sources.length
    ) {
      throw new LiveSessionEventInputError();
    }
    return {
      sources: input.sources as ConsentEvent['sources'],
      type: 'consent',
    };
  }

  if (input.type !== 'utterance') {
    throw new LiveSessionEventInputError();
  }

  const sequence = parseNonNegativeInteger(input.sequence);
  const startMs = parseNonNegativeInteger(input.startMs);
  const endMs = parseNonNegativeInteger(input.endMs);
  if (endMs < startMs) {
    throw new LiveSessionEventInputError();
  }

  const speakers = ['interviewer', 'interviewee', 'unknown'] as const;
  if (!speakers.includes(input.speaker as (typeof speakers)[number])) {
    throw new LiveSessionEventInputError();
  }

  const confidence = input.confidence;
  if (
    confidence !== null &&
    (typeof confidence !== 'number' ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1)
  ) {
    throw new LiveSessionEventInputError();
  }

  return {
    confidence,
    endMs,
    id: parseIdentifier(input.id),
    sequence,
    speaker: input.speaker as UtteranceEvent['speaker'],
    startMs,
    text: parseBoundedText(input.text, 12000),
    type: 'utterance',
  };
}
