import type { TranscriptSegment } from './transcription.js';

export interface DetectedQuestion {
  id: string;
  sessionId: string;
  sourceSegmentIds: string[];
  text: string;
  context: string;
  detectedAtMs: number;
  confidence: number;
}

export interface QuestionDetector {
  detect(segments: TranscriptSegment[]): Promise<DetectedQuestion[]>;
}
