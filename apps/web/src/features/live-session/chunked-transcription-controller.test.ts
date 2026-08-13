import { describe, expect, it, vi } from 'vitest';

import type { BrowserAudioSource } from '../capture/browser-capture-controller.js';
import { createChunkedTranscriptionController } from './chunked-transcription-controller.js';

function source(kind: BrowserAudioSource['source']): BrowserAudioSource {
  return {
    source: kind,
    stream: { getAudioTracks: () => [], getTracks: () => [] },
  };
}

describe('chunked transcription controller', () => {
  it('uploads visible source chunks and maps browser audio to the interviewer', async () => {
    let dataListener: EventListener | undefined;
    let rotate: (() => void) | undefined;
    const recorder = {
      addEventListener: vi.fn(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          if (type === 'dataavailable') {
            dataListener =
              typeof listener === 'function'
                ? listener
                : (event) => listener.handleEvent(event);
          }
        },
      ),
      mimeType: 'audio/webm',
      start: vi.fn(),
      state: 'recording',
      stop: vi.fn(() =>
        dataListener?.({
          data: new Blob(['audio'], { type: 'audio/webm' }),
        } as unknown as Event),
      ),
    };
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'What did you measure?' }), {
        status: 200,
      }),
    );
    const transcript = vi.fn();
    const controller = createChunkedTranscriptionController({
      fetchImpl,
      mediaRecorderFactory: () => recorder,
      now: vi.fn().mockReturnValueOnce(1_000).mockReturnValue(7_000),
      randomId: () => 'segment-1',
      scheduleEvery: (callback, milliseconds) => {
        expect(milliseconds).toBe(6_000);
        rotate = callback;
        return vi.fn();
      },
      sessionId: 'session-1',
    });

    controller.start([source('browser-tab')], transcript, vi.fn());
    expect(recorder.start).toHaveBeenCalledWith();
    rotate?.();
    await controller.flush();
    expect(recorder.stop).toHaveBeenCalledOnce();
    expect(recorder.start).toHaveBeenCalledTimes(2);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/sessions/session-1/transcribe',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(transcript).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'segment-1',
        sequence: 0,
        speaker: 'Interviewer',
        text: 'What did you measure?',
      }),
    );
  });

  it('does not schedule duplicate starts or upload queued audio after stop', async () => {
    const listeners: EventListener[] = [];
    const recorder = {
      addEventListener: vi.fn(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          if (type === 'dataavailable' && typeof listener === 'function') {
            listeners.push(listener);
          }
        },
      ),
      mimeType: 'audio/webm',
      start: vi.fn(),
      state: 'inactive',
      stop: vi.fn(),
    };
    const fetchImpl = vi.fn();
    const controller = createChunkedTranscriptionController({
      fetchImpl,
      mediaRecorderFactory: () => recorder,
      scheduleEvery: () => vi.fn(),
      sessionId: 'session-1',
    });

    controller.start([source('microphone')], vi.fn(), vi.fn());
    controller.start([source('microphone')], vi.fn(), vi.fn());
    listeners[0]?.({
      data: new Blob(['audio'], { type: 'audio/webm' }),
    } as unknown as Event);
    await controller.stop();

    expect(recorder.start).toHaveBeenCalledOnce();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
