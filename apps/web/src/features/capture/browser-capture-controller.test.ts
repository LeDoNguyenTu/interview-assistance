import { describe, expect, it, vi } from 'vitest';

import { createBrowserCaptureController } from './browser-capture-controller.js';

type Listener = () => void;

function track(kind: 'audio' | 'video') {
  const listeners = new Set<Listener>();
  return {
    addEventListener: vi.fn((_type: 'ended', listener: Listener) =>
      listeners.add(listener),
    ),
    emitEnded: () => listeners.forEach((listener) => listener()),
    kind,
    removeEventListener: vi.fn((_type: 'ended', listener: Listener) =>
      listeners.delete(listener),
    ),
    stop: vi.fn(),
  };
}

function stream(...tracks: ReturnType<typeof track>[]) {
  return {
    getAudioTracks: () => tracks.filter((item) => item.kind === 'audio'),
    getTracks: () => tracks,
  };
}

describe('BrowserCaptureController', () => {
  it('stops every acquired track when the user stops capture', async () => {
    const microphone = track('audio');
    const displayAudio = track('audio');
    const displayVideo = track('video');
    const controller = createBrowserCaptureController({
      getDisplayMedia: vi
        .fn()
        .mockResolvedValue(stream(displayAudio, displayVideo)),
      getUserMedia: vi.fn().mockResolvedValue(stream(microphone)),
    });

    await controller.prepare({ displayAudio: true, microphone: true });
    expect(controller.audioSources().map((item) => item.source)).toEqual([
      'microphone',
      'browser-tab',
    ]);
    await controller.start();
    await controller.stop('user');

    expect(microphone.stop).toHaveBeenCalledOnce();
    expect(displayAudio.stop).toHaveBeenCalledOnce();
    expect(displayVideo.stop).toHaveBeenCalledOnce();
    expect(controller.snapshot()).toMatchObject({ status: 'stopped' });
  });

  it('stops partially acquired streams when a later source request fails', async () => {
    const microphone = track('audio');
    const controller = createBrowserCaptureController({
      getDisplayMedia: vi.fn().mockRejectedValue(new Error('picker cancelled')),
      getUserMedia: vi.fn().mockResolvedValue(stream(microphone)),
    });

    await expect(
      controller.prepare({ displayAudio: true, microphone: true }),
    ).rejects.toThrow('Unable to prepare the selected capture sources.');

    expect(microphone.stop).toHaveBeenCalledOnce();
    expect(controller.snapshot()).toMatchObject({
      error: 'capture-unavailable',
      status: 'failed',
    });
  });

  it('interrupts and cleans up when the browser ends a selected source', async () => {
    const microphone = track('audio');
    const displayAudio = track('audio');
    const controller = createBrowserCaptureController({
      getDisplayMedia: vi.fn().mockResolvedValue(stream(displayAudio)),
      getUserMedia: vi.fn().mockResolvedValue(stream(microphone)),
    });

    await controller.prepare({ displayAudio: true, microphone: true });
    await controller.start();
    displayAudio.emitEnded();
    await Promise.resolve();

    expect(microphone.stop).toHaveBeenCalledOnce();
    expect(displayAudio.stop).toHaveBeenCalledOnce();
    expect(controller.snapshot()).toMatchObject({ status: 'interrupted' });
  });

  it('does not access browser media APIs for an empty source selection', async () => {
    const adapter = {
      getDisplayMedia: vi.fn(),
      getUserMedia: vi.fn(),
    };
    const controller = createBrowserCaptureController(adapter);

    await expect(
      controller.prepare({ displayAudio: false, microphone: false }),
    ).rejects.toThrow('Select at least one audio source before capture.');

    expect(adapter.getUserMedia).not.toHaveBeenCalled();
    expect(adapter.getDisplayMedia).not.toHaveBeenCalled();
  });
});
