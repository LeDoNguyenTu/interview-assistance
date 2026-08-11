import type { GuidanceRequest } from './guidance.js';
import type { TranscriptSegment } from './transcription.js';

export type InputInvariant =
  | 'empty_session_id'
  | 'question_session_mismatch'
  | 'invalid_question'
  | 'invalid_transcript_segment'
  | 'mixed_transcript_sessions'
  | 'unordered_transcript_segments';

export function validateGuidanceRequest(
  request: GuidanceRequest,
): InputInvariant | null {
  if (!hasText(request.sessionId)) {
    return 'empty_session_id';
  }

  if (
    !hasText(request.question.id) ||
    !hasText(request.question.text) ||
    !hasText(request.question.context) ||
    request.question.sourceSegmentIds.length === 0 ||
    request.question.sourceSegmentIds.some((id) => !hasText(id)) ||
    !isNonNegativeFinite(request.question.detectedAtMs) ||
    !isConfidence(request.question.confidence)
  ) {
    return 'invalid_question';
  }

  if (request.question.sessionId !== request.sessionId) {
    return 'question_session_mismatch';
  }

  return validateTranscriptSegments(
    request.recentTranscript,
    request.sessionId,
  );
}

export function validateQuestionDetectionInput(
  segments: TranscriptSegment[],
): InputInvariant | null {
  const invalidSegment = validateTranscriptSegments(segments);
  if (invalidSegment !== null) {
    return invalidSegment;
  }

  const first = segments[0];
  if (first === undefined) {
    return null;
  }

  let previous = first;
  for (const segment of segments.slice(1)) {
    if (segment.sessionId !== first.sessionId) {
      return 'mixed_transcript_sessions';
    }

    if (
      segment.sequence <= previous.sequence ||
      segment.startedAtMs < previous.startedAtMs
    ) {
      return 'unordered_transcript_segments';
    }

    previous = segment;
  }

  return null;
}

export function validateTranscriptSegments(
  segments: TranscriptSegment[],
  expectedSessionId?: string,
): InputInvariant | null {
  for (const segment of segments) {
    if (
      !hasText(segment.id) ||
      !hasText(segment.sessionId) ||
      !hasText(segment.text) ||
      !Number.isInteger(segment.sequence) ||
      segment.sequence < 0 ||
      !isNonNegativeFinite(segment.startedAtMs) ||
      !isNonNegativeFinite(segment.endedAtMs) ||
      segment.endedAtMs < segment.startedAtMs ||
      !isConfidence(segment.confidence)
    ) {
      return 'invalid_transcript_segment';
    }

    if (
      expectedSessionId !== undefined &&
      segment.sessionId !== expectedSessionId
    ) {
      return 'mixed_transcript_sessions';
    }
  }

  return null;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isConfidence(value: number | null): boolean {
  return value === null || (Number.isFinite(value) && value >= 0 && value <= 1);
}
