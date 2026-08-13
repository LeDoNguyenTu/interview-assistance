import { describe, expect, it } from 'vitest';

import { detectBrowserCaptureCapabilities } from './browser-capabilities.js';

describe('detectBrowserCaptureCapabilities', () => {
  it('reports a secure browser with microphone and display selection support without promising display audio', () => {
    expect(
      detectBrowserCaptureCapabilities({
        audioWorklet: true,
        displayMedia: true,
        microphone: true,
        secureContext: true,
      }),
    ).toEqual({
      audioWorklet: true,
      displayAudioRequested: true,
      displayMedia: true,
      microphone: true,
      secureContext: true,
    });
  });

  it('fails closed for an insecure or unsupported environment', () => {
    expect(
      detectBrowserCaptureCapabilities({
        audioWorklet: true,
        displayMedia: true,
        microphone: true,
        secureContext: false,
      }),
    ).toMatchObject({
      displayMedia: false,
      microphone: false,
      secureContext: false,
    });
  });
});
