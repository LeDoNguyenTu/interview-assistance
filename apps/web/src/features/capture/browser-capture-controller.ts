import type { CaptureSelection } from './consent-machine';

type MediaTrackLike = {
  kind: 'audio' | 'video' | string;
  stop(): void;
  addEventListener?(type: 'ended', listener: () => void): void;
  removeEventListener?(type: 'ended', listener: () => void): void;
};

type MediaStreamLike = {
  getAudioTracks(): MediaTrackLike[];
  getTracks(): MediaTrackLike[];
};

export type BrowserMediaAdapter = {
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStreamLike>;
  getDisplayMedia(
    constraints: DisplayMediaStreamOptions,
  ): Promise<MediaStreamLike>;
};

export type CaptureControllerStatus =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'capturing'
  | 'interrupted'
  | 'failed'
  | 'stopped';

export type CaptureControllerError =
  | 'capture-unavailable'
  | 'display-audio-unavailable'
  | 'empty-selection'
  | null;

export type BrowserCaptureSnapshot = {
  status: CaptureControllerStatus;
  activeSources: Array<'microphone' | 'browser-tab'>;
  displayAudioAvailable: boolean | null;
  startedAtMs: number | null;
  error: CaptureControllerError;
};

export type CaptureStopReason = 'user' | 'permission-ended' | 'error';

export interface BrowserCaptureController {
  prepare(selection: CaptureSelection): Promise<BrowserCaptureSnapshot>;
  start(): Promise<BrowserCaptureSnapshot>;
  stop(reason: CaptureStopReason): Promise<BrowserCaptureSnapshot>;
  dispose(): Promise<void>;
  snapshot(): BrowserCaptureSnapshot;
  subscribe(listener: (snapshot: BrowserCaptureSnapshot) => void): () => void;
}

const idleSnapshot: BrowserCaptureSnapshot = {
  activeSources: [],
  displayAudioAvailable: null,
  error: null,
  startedAtMs: null,
  status: 'idle',
};

function hasSource(selection: CaptureSelection): boolean {
  return selection.microphone || selection.displayAudio;
}

export function createBrowserCaptureController(
  adapter: BrowserMediaAdapter,
): BrowserCaptureController {
  let current = { ...idleSnapshot };
  let streams: MediaStreamLike[] = [];
  let endingListeners = new Map<MediaTrackLike, () => void>();
  const listeners = new Set<(snapshot: BrowserCaptureSnapshot) => void>();
  let stopping = false;

  function publish(snapshot: BrowserCaptureSnapshot): BrowserCaptureSnapshot {
    current = snapshot;
    listeners.forEach((listener) => listener({ ...snapshot }));
    return snapshot;
  }

  function detachEndingListeners(): void {
    endingListeners.forEach((listener, track) => {
      track.removeEventListener?.('ended', listener);
    });
    endingListeners = new Map();
  }

  function releaseTracks(): void {
    const uniqueTracks = new Set<MediaTrackLike>();
    streams.forEach((stream) => {
      stream.getTracks().forEach((track) => uniqueTracks.add(track));
    });
    detachEndingListeners();
    streams = [];
    uniqueTracks.forEach((track) => track.stop());
  }

  async function interrupt(): Promise<void> {
    if (
      stopping ||
      (current.status !== 'capturing' && current.status !== 'ready')
    ) {
      return;
    }

    stopping = true;
    releaseTracks();
    stopping = false;
    publish({
      activeSources: [],
      displayAudioAvailable: current.displayAudioAvailable,
      error: null,
      startedAtMs: null,
      status: 'interrupted',
    });
  }

  function listenForEnding(stream: MediaStreamLike): void {
    stream.getTracks().forEach((track) => {
      const listener = () => {
        void interrupt();
      };
      track.addEventListener?.('ended', listener);
      endingListeners.set(track, listener);
    });
  }

  return {
    async prepare(selection) {
      if (!hasSource(selection)) {
        publish({
          ...idleSnapshot,
          error: 'empty-selection',
          status: 'failed',
        });
        throw new Error('Select at least one audio source before capture.');
      }

      if (streams.length > 0) {
        await this.stop('error');
      }

      publish({ ...idleSnapshot, status: 'preparing' });
      const acquiredStreams: MediaStreamLike[] = [];
      try {
        if (selection.microphone) {
          const microphone = await adapter.getUserMedia({
            audio: true,
            video: false,
          });
          acquiredStreams.push(microphone);
        }
        if (selection.displayAudio) {
          const display = await adapter.getDisplayMedia({
            audio: true,
            video: true,
          });
          acquiredStreams.push(display);
        }

        const displayStream = selection.displayAudio
          ? acquiredStreams.at(-1)
          : undefined;
        const displayAudioAvailable = selection.displayAudio
          ? (displayStream?.getAudioTracks().length ?? 0) > 0
          : null;
        const activeSources: Array<'microphone' | 'browser-tab'> = [];
        if (selection.microphone) activeSources.push('microphone');
        if (displayAudioAvailable) activeSources.push('browser-tab');

        if (activeSources.length === 0) {
          acquiredStreams.forEach((stream) =>
            stream.getTracks().forEach((track) => track.stop()),
          );
          publish({
            activeSources: [],
            displayAudioAvailable,
            error: 'display-audio-unavailable',
            startedAtMs: null,
            status: 'failed',
          });
          throw new Error(
            'The selected display source did not provide an audio track.',
          );
        }

        streams = acquiredStreams;
        streams.forEach(listenForEnding);
        return publish({
          activeSources,
          displayAudioAvailable,
          error: null,
          startedAtMs: null,
          status: 'ready',
        });
      } catch (error) {
        acquiredStreams.forEach((stream) =>
          stream.getTracks().forEach((track) => track.stop()),
        );
        streams = [];
        detachEndingListeners();
        if (current.error !== 'display-audio-unavailable') {
          publish({
            ...idleSnapshot,
            error: 'capture-unavailable',
            status: 'failed',
          });
          throw new Error('Unable to prepare the selected capture sources.');
        }
        throw error;
      }
    },
    async start() {
      if (current.status === 'capturing') return { ...current };
      if (current.status !== 'ready') {
        throw new Error('Prepare capture sources before starting capture.');
      }

      return publish({
        ...current,
        startedAtMs: Date.now(),
        status: 'capturing',
      });
    },
    async stop(reason) {
      if (current.status === 'stopped') return { ...current };

      stopping = true;
      releaseTracks();
      stopping = false;
      return publish({
        activeSources: [],
        displayAudioAvailable: current.displayAudioAvailable,
        error: reason === 'error' ? 'capture-unavailable' : null,
        startedAtMs: null,
        status: reason === 'permission-ended' ? 'interrupted' : 'stopped',
      });
    },
    async dispose() {
      await this.stop('user');
      listeners.clear();
    },
    snapshot() {
      return { ...current };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function createNavigatorMediaAdapter(): BrowserMediaAdapter {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    throw new Error('Browser media devices are unavailable.');
  }

  return {
    getDisplayMedia: (constraints) =>
      navigator.mediaDevices.getDisplayMedia(constraints),
    getUserMedia: (constraints) =>
      navigator.mediaDevices.getUserMedia(constraints),
  };
}
