import { describe, expect, it } from 'vitest';

import { groupTranscriptByQuestion } from './conversation-groups';
import type { LiveTranscriptItem } from './live-session-machine';

function item(
  id: string,
  speaker: LiveTranscriptItem['speaker'],
  text: string,
  sequence: number,
): LiveTranscriptItem {
  return {
    confidence: 0.94,
    endMs: sequence * 1000 + 900,
    id,
    partial: false,
    sequence,
    speaker,
    startMs: sequence * 1000,
    text,
    timestamp: `00:0${sequence}`,
  };
}

describe('groupTranscriptByQuestion', () => {
  it('groups each interviewer question with the response turns that follow it', () => {
    const groups = groupTranscriptByQuestion([
      item('q1', 'Interviewer', 'Tell me about your background', 0),
      item('a1', 'Participant', 'I started in product design.', 1),
      item('follow-on', 'Interviewer', 'That role sounds cross-functional.', 2),
      item('q2', 'Interviewer', 'How did you measure the result', 3),
      item('a2', 'Participant', 'We tracked activation and retention.', 4),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.question?.id).toBe('q1');
    expect(groups[0]?.questionNumber).toBe(1);
    expect(groups[0]?.turns.map((turn) => turn.id)).toEqual([
      'a1',
      'follow-on',
    ]);
    expect(groups[1]?.question?.id).toBe('q2');
    expect(groups[1]?.questionNumber).toBe(2);
    expect(groups[1]?.turns.map((turn) => turn.id)).toEqual(['a2']);
  });

  it('preserves opening context before the first recognized question', () => {
    const groups = groupTranscriptByQuestion([
      item('intro', 'Interviewer', 'Thanks for joining today.', 0),
      item('reply', 'Participant', 'Happy to be here.', 1),
      item('q1', 'Interviewer', 'Walk me through your recent project', 2),
    ]);

    expect(groups[0]?.question).toBeNull();
    expect(groups[0]?.questionNumber).toBeNull();
    expect(groups[0]?.turns.map((turn) => turn.id)).toEqual(['intro', 'reply']);
    expect(groups[1]?.question?.id).toBe('q1');
    expect(groups[1]?.questionNumber).toBe(1);
  });

  it('returns no empty groups for an empty transcript', () => {
    expect(groupTranscriptByQuestion([])).toEqual([]);
  });
});
