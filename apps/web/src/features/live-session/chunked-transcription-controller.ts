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
  chunkDurationMs: number;
  fetchImpl: typeof fetch;
  maxPendingSegmentsPerSource: number;
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
  const chunkDurationMs = Math.max(
    1_000,
    dependencies.chunkDurationMs ?? 3_000,
  );
  const maxPendingSegmentsPerSource = Math.max(
    1,
    dependencies.maxPendingSegmentsPerSource ?? 4,
  );
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
  const queues = new Map<BrowserAudioSource['source'], Promise<void>>();
  const pendingCounts = new Map<BrowserAudioSource['source'], number>();
  const backpressureWarnings = new Set<BrowserAudioSource['source']>();
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
    if (blob.size < 1 || !running) return;
    const pendingCount = pendingCounts.get(source) ?? 0;
    if (pendingCount >= maxPendingSegmentsPerSource) {
      if (!backpressureWarnings.has(source)) {
        backpressureWarnings.add(source);
        onError(
          'Transcription is falling behind. One audio segment was skipped to keep the live session responsive.',
        );
      }
      return;
    }

    const queuedGeneration = generation;
    const itemSequence = sequence++;
    pendingCounts.set(source, pendingCount + 1);
    const previousQueue = queues.get(source) ?? Promise.resolve();
    const nextQueue = previousQueue
      .then(async () => {
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
            sequence: itemSequence,
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
      })
      .finally(() => {
        pendingCounts.set(
          source,
          Math.max(0, (pendingCounts.get(source) ?? 1) - 1),
        );
      });
    queues.set(source, nextQueue);
  }

  return {
    flush: async () => {
      await Promise.all(queues.values());
    },
    start(sources, onTranscript, onError) {
      if (running) return;
      running = true;
      generation += 1;
      queues.clear();
      pendingCounts.clear();
      backpressureWarnings.clear();
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
      }, chunkDurationMs);
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
      await Promise.all(queues.values());
    },
  };
}
