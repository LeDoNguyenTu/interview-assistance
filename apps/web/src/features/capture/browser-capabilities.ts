export interface BrowserCaptureCapabilities {
  microphone: boolean;
  displayMedia: boolean;
  displayAudioRequested: boolean;
  audioWorklet: boolean;
  secureContext: boolean;
}

export type BrowserCaptureCapabilityProbe = {
  microphone: boolean;
  displayMedia: boolean;
  audioWorklet: boolean;
  secureContext: boolean;
};

export function detectBrowserCaptureCapabilities(
  probe: BrowserCaptureCapabilityProbe,
): BrowserCaptureCapabilities {
  const supported = probe.secureContext;

  return {
    audioWorklet: supported && probe.audioWorklet,
    displayAudioRequested: supported && probe.displayMedia,
    displayMedia: supported && probe.displayMedia,
    microphone: supported && probe.microphone,
    secureContext: probe.secureContext,
  };
}

export function inspectBrowserCaptureCapabilities(): BrowserCaptureCapabilities {
  if (typeof window === 'undefined') {
    return detectBrowserCaptureCapabilities({
      audioWorklet: false,
      displayMedia: false,
      microphone: false,
      secureContext: false,
    });
  }

  const mediaDevices = window.navigator.mediaDevices;
  return detectBrowserCaptureCapabilities({
    audioWorklet:
      typeof window.AudioContext !== 'undefined' &&
      'audioWorklet' in window.AudioContext.prototype,
    displayMedia: typeof mediaDevices?.getDisplayMedia === 'function',
    microphone: typeof mediaDevices?.getUserMedia === 'function',
    secureContext: window.isSecureContext,
  });
}
