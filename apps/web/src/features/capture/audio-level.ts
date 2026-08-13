export type AudioLevel = {
  peak: number;
  rms: number;
};

function clampNormalisedSample(sample: number): number {
  return Math.max(-1, Math.min(1, sample));
}

export function calculateAudioLevel(samples: Float32Array): AudioLevel {
  if (samples.length === 0) return { peak: 0, rms: 0 };

  let peak = 0;
  let sumOfSquares = 0;
  for (const sample of samples) {
    const value = clampNormalisedSample(sample);
    peak = Math.max(peak, Math.abs(value));
    sumOfSquares += value * value;
  }

  return { peak, rms: Math.sqrt(sumOfSquares / samples.length) };
}
