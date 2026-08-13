import { describe, expect, it } from 'vitest';

import { calculateAudioLevel } from './audio-level.js';

describe('calculateAudioLevel', () => {
  it('returns silence for empty and zero sample windows', () => {
    expect(calculateAudioLevel(new Float32Array())).toEqual({
      peak: 0,
      rms: 0,
    });
    expect(calculateAudioLevel(new Float32Array([0, 0, 0]))).toEqual({
      peak: 0,
      rms: 0,
    });
  });

  it('calculates bounded peak and RMS values from normalised samples', () => {
    expect(calculateAudioLevel(new Float32Array([0.5, -0.5]))).toEqual({
      peak: 0.5,
      rms: 0.5,
    });
    expect(calculateAudioLevel(new Float32Array([2, -2]))).toEqual({
      peak: 1,
      rms: 1,
    });
  });
});
