import { describe, expect, it } from 'vitest';

import {
  isLikelyInterviewQuestion,
  latestInterviewerQuestion,
} from './question-detection';

const transcript = [
  {
    confidence: 0.9,
    endMs: 2000,
    id: 'first',
    partial: false as const,
    sequence: 0,
    speaker: 'Interviewer' as const,
    startMs: 0,
    text: 'Tell me about your background',
    timestamp: '00:00',
  },
  {
    confidence: 0.9,
    endMs: 4000,
    id: 'answer',
    partial: false as const,
    sequence: 1,
    speaker: 'Participant' as const,
    startMs: 2000,
    text: 'I have five years of product experience.',
    timestamp: '00:02',
  },
  {
    confidence: 0.9,
    endMs: 6000,
    id: 'latest',
    partial: false as const,
    sequence: 2,
    speaker: 'Interviewer' as const,
    startMs: 4000,
    text: 'How did you measure the result',
    timestamp: '00:04',
  },
];

describe('question detection', () => {
  it('recognizes interview questions even when transcription omits punctuation', () => {
    expect(isLikelyInterviewQuestion('Can you hear me talking')).toBe(true);
    expect(isLikelyInterviewQuestion('Tell me about a difficult project')).toBe(
      true,
    );
    expect(isLikelyInterviewQuestion('Walk me through your decision')).toBe(
      true,
    );
    expect(
      isLikelyInterviewQuestion('Please tell me about a difficult project'),
    ).toBe(true);
    expect(
      isLikelyInterviewQuestion("I'd like you to describe your approach"),
    ).toBe(true);
    expect(isLikelyInterviewQuestion('The project shipped last week')).toBe(
      false,
    );
    expect(
      isLikelyInterviewQuestion(
        "What I'd like to do now is explain the process",
      ),
    ).toBe(false);
    expect(
      isLikelyInterviewQuestion('How I see the role evolving is over time'),
    ).toBe(false);
    expect(
      isLikelyInterviewQuestion("I'd like to explain the hiring process"),
    ).toBe(false);
    expect(
      isLikelyInterviewQuestion(
        'I would like to share some context about the role',
      ),
    ).toBe(false);
  });

  it('returns the latest interviewer question rather than the first one', () => {
    expect(latestInterviewerQuestion(transcript)?.id).toBe('latest');
  });
});
