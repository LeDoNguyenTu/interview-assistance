import { describe, expect, it, vi } from 'vitest';

import {
  NativeCaptureError,
  createNativeCaptureBridge,
} from './native-capture.js';

const device = {
  channels: 2,
  id: 'microphone-1',
  isDefault: true,
  name: 'Built-in microphone',
  sampleRate: 48_000,
  source: 'microphone',
};

describe('native capture bridge', () => {
  it('validates command results before exposing them', async () => {
    const invoke = vi.fn().mockResolvedValue([device]);
    const bridge = createNativeCaptureBridge({ invoke, listen: vi.fn() });

    await expect(bridge.listAudioDevices()).resolves.toEqual([device]);
    expect(invoke).toHaveBeenCalledWith('list_audio_devices');

    invoke.mockResolvedValueOnce([{ ...device, sampleRate: -1 }]);
    await expect(bridge.listAudioDevices()).rejects.toMatchObject({
      category: 'internal',
    });
  });

  it('passes a consent token into preparation and validates status', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({ state: 'preparing' })
      .mockResolvedValueOnce({ state: 'capturing' });
    const bridge = createNativeCaptureBridge({ invoke, listen: vi.fn() });
    const config = {
      frameDurationMs: 20,
      microphoneDeviceId: 'microphone-1',
      outputDeviceId: null,
      sessionId: 'session-1',
      targetSampleRate: 16_000,
    };

    await expect(bridge.prepareCapture(config, 'consent-1')).resolves.toEqual({
      state: 'preparing',
    });
    await expect(bridge.captureStatus()).resolves.toEqual({
      state: 'capturing',
    });
    expect(invoke).toHaveBeenNthCalledWith(1, 'prepare_capture', {
      config,
      consentToken: 'consent-1',
    });
  });

  it('validates native event payloads before notifying React', async () => {
    let eventHandler: ((event: { payload: unknown }) => void) | undefined;
    const listen = vi.fn(async (_name, handler) => {
      eventHandler = handler;
      return () => undefined;
    });
    const onState = vi.fn();
    const bridge = createNativeCaptureBridge({ invoke: vi.fn(), listen });

    await bridge.onState(onState);
    eventHandler?.({ payload: { state: 'capturing' } });
    expect(onState).toHaveBeenCalledWith({ state: 'capturing' });

    expect(() =>
      eventHandler?.({ payload: { state: 'secret-state' } }),
    ).toThrow(NativeCaptureError);
  });

  it('maps native failures to stable public categories', async () => {
    const bridge = createNativeCaptureBridge({
      invoke: vi.fn().mockRejectedValue({
        category: 'device-lost',
        message: 'Endpoint C:\\private\\device disappeared',
      }),
      listen: vi.fn(),
    });

    await expect(bridge.startCapture()).rejects.toMatchObject({
      category: 'device-lost',
      message: 'The selected audio device disconnected.',
    });
  });
});
