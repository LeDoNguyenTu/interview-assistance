import type { ProviderId, SessionMode } from '@candorlens/core';

import type { DetectedQuestion } from './questions.js';
import type { TranscriptSegment } from './transcription.js';

export interface GuidanceRequest {
  sessionId: string;
  mode: SessionMode;
  question: DetectedQuestion;
  recentTranscript: TranscriptSegment[];
  profileContext: string[];
  signal?: AbortSignal;
}

export interface GuidanceResult {
  requestId: string;
  summary: string;
  talkingPoints: string[];
  cautions: string[];
  followUps: string[];
  providerId: ProviderId;
  model: string;
  usage: { inputTokens: number | null; outputTokens: number | null };
}

export interface GuidanceProvider {
  readonly id: ProviderId;
  generateGuidance(request: GuidanceRequest): Promise<GuidanceResult>;
}
