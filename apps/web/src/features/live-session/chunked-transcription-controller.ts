import type { BrowserAudioSource } from '../capture/browser-capture-controller';
import type { LiveTranscriptItem } from './live-session-machine';

type RecorderLike = {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void;
  mimeType: string;
  start(): void;
  state: string;
  stop(): void;
};

type Dependencies = {
  fetchImpl: typeof fetch;
  mediaRecorderFactory: (stream: unknown) => RecorderLike;
  now: () => number;
  randomId: () => string;
  scheduleEvery: (callback: () => void, milliseconds: number) => () => void;
  sessionId: string;
  startingSequence: number;
};

export type ChunkedTranscriptionController = {
  flush(): Promise<void>;
  start(
    sources: readonly BrowserAudioSource[],
    onTranscript: (item: LiveTranscriptItem) => void,
    onError: (message: string) => void,
  ): void;
  stop(): Promise<void>;
};

function defaultRecorder(stream: unknown): RecorderLike {
  const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
    (type) => MediaRecorder.isTypeSupported(type),
  );
  const audioOnlyStream = new MediaStream(
    (stream as MediaStream).getAudioTracks(),
  );
  return new MediaRecorder(
    audioOnlyStream,
    preferred ? { mimeType: preferred } : undefined,
  );
}

function defaultScheduleEvery(callback: () => void, milliseconds: number) {
  const timer = window.setInterval(callback, milliseconds);
  return () => window.clearInterval(timer);
}

function timestamp(milliseconds: number): string {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export function createChunkedTranscriptionController(
  dependencies: Partial<Dependencies> & Pick<Dependencies, 'sessionId'>,
): ChunkedTranscriptionController {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const mediaRecorderFactory =
    dependencies.mediaRecorderFactory ?? defaultRecorder;
  const now = dependencies.now ?? Date.now;
  const randomId = dependencies.randomId ?? (() => crypto.randomUUID());
  const scheduleEvery = dependencies.scheduleEvery ?? defaultScheduleEvery;
  const activeRecorders = new Map<BrowserAudioSource['source'], RecorderLike>();
  const sourceStreams = new Map<
    BrowserAudioSource['source'],
    BrowserAudioSource['stream']
  >();
  const activeRequests = new Set<AbortController>();
  let queue = Promise.resolve();
  let sequence = dependencies.startingSequence ?? 0;
  let cancelRotation: (() => void) | null = null;
  let captureStartedAt = 0;
  let running = false;
  let generation = 0;

  function enqueue(
    blob: Blob,
    source: BrowserAudioSource['source'],
    startMs: number,
    endMs: number,
    onTranscript: (item: LiveTranscriptItem) => void,
    onError: (message: string) => void,
  ) {
    if (blob.size < 1) return;
    const queuedGeneration = generation;
    queue = queue.then(async () => {
      if (!running || queuedGeneration !== generation) return;
      try {
        const requestController = new AbortController();
        activeRequests.add(requestController);
        const requestTimeout = globalThis.setTimeout(
          () => requestController.abort(),
          20_000,
        );
        const form = new FormData();
        form.set('audio', blob, 'live-segment.webm');
        let response: Response;
        try {
          response = await fetchImpl(
            `/api/sessions/${dependencies.sessionId}/transcribe`,
            {
              body: form,
              method: 'POST',
              signal: requestController.signal,
            },
          );
        } finally {
          globalThis.clearTimeout(requestTimeout);
          activeRequests.delete(requestController);
        }
        const payload = (await response.json()) as {
          error?: unknown;
          text?: unknown;
        };
        if (!response.ok || typeof payload.text !== 'string') {
          throw new Error();
        }
        const text = payload.text.trim();
        if (!text) return;
        onTranscript({
          confidence: null,
          endMs,
          id: randomId(),
          partial: false,
          sequence: sequence++,
          speaker: source === 'browser-tab' ? 'Interviewer' : 'Participant',
          startMs,
          text,
          timestamp: timestamp(startMs),
        });
      } catch {
        if (!running || queuedGeneration !== generation) return;
        onError(
          'A live audio segment could not be transcribed. Capture remains visible and active.',
        );
      }
    });
  }

  return {
    flush: () => queue,
    start(sources, onTranscript, onError) {
      if (running) return;
      running = true;
      generation += 1;
      captureStartedAt = now();
      const beginSegment = (
        source: BrowserAudioSource['source'],
        stream: BrowserAudioSource['stream'],
      ) => {
        const recorder = mediaRecorderFactory(stream);
        const segmentStart = Math.max(0, now() - captureStartedAt);
        recorder.addEventListener('dataavailable', (event) => {
          const data = (event as BlobEvent).data;
          const segmentEnd = Math.max(0, now() - captureStartedAt);
          enqueue(
            data,
            source,
            segmentStart,
            segmentEnd,
            onTranscript,
            onError,
          );
        });
        recorder.start();
        activeRecorders.set(source, recorder);
      };

      sources.forEach(({ source, stream }) => {
        sourceStreams.set(source, stream);
        beginSegment(source, stream);
      });
      cancelRotation = scheduleEvery(() => {
        if (!running) return;
        sourceStreams.forEach((stream, source) => {
          const recorder = activeRecorders.get(source);
          if (recorder?.state !== 'inactive') recorder?.stop();
          beginSegment(source, stream);
        });
      }, 6_000);
    },
    async stop() {
      running = false;
      generation += 1;
      cancelRotation?.();
      cancelRotation = null;
      activeRequests.forEach((request) => request.abort());
      const stopped = [...activeRecorders.values()].map(
        (recorder) =>
          new Promise<void>((resolve) => {
            if (recorder.state === 'inactive') {
              resolve();
              return;
            }
            recorder.addEventListener('stop', () => resolve(), { once: true });
            recorder.stop();
          }),
      );
      activeRecorders.clear();
      await Promise.all(stopped);
      await queue;
    },
  };
}
