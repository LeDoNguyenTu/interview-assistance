import { describe, expect, it } from 'vitest';

import { reconcileDeviceSelection } from './device-selection.js';

const devices = [
  {
    channels: 1,
    id: 'microphone:a',
    isDefault: false,
    name: 'USB microphone',
    sampleRate: 48_000,
    source: 'microphone' as const,
  },
  {
    channels: 2,
    id: 'microphone:b',
    isDefault: true,
    name: 'Studio microphone',
    sampleRate: 48_000,
    source: 'microphone' as const,
  },
  {
    channels: 2,
    id: 'system-output:a',
    isDefault: true,
    name: 'Speakers',
    sampleRate: 48_000,
    source: 'system-output' as const,
  },
];

describe('reconcileDeviceSelection', () => {
  it('keeps connected selections and chooses defaults for new sources', () => {
    expect(
      reconcileDeviceSelection(devices, {
        microphoneDeviceId: 'microphone:a',
        outputDeviceId: null,
      }),
    ).toEqual({
      microphoneDeviceId: 'microphone:a',
      outputDeviceId: 'system-output:a',
    });
  });

  it('falls back after a selected device disconnects', () => {
    expect(
      reconcileDeviceSelection(devices.slice(1), {
        microphoneDeviceId: 'microphone:a',
        outputDeviceId: 'system-output:missing',
      }),
    ).toEqual({
      microphoneDeviceId: 'microphone:b',
      outputDeviceId: 'system-output:a',
    });
  });

  it('represents missing source groups explicitly', () => {
    expect(reconcileDeviceSelection([], undefined)).toEqual({
      microphoneDeviceId: null,
      outputDeviceId: null,
    });
  });
});
