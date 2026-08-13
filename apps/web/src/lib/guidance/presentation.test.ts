import { describe, expect, it } from 'vitest';

import { guidanceLabelForMode, normalizeGuidanceText } from './presentation';

describe('guidance presentation', () => {
  it('turns legacy Gemini review Markdown into clean suggestion text', () => {
    expect(
      normalizeGuidanceText(
        '**Session Draft for Human Review** **Summary:** This was an audio check. --- **Suggested Reflection Prompt:** *How can you transition into the session?*',
      ),
    ).toBe('How can you transition into the session?');
  });

  it('preserves both parts of a labelled Defense response', () => {
    expect(
      normalizeGuidanceText(
        '**Evidence check:** The claimed result is not yet supported.\n**Follow-up question:** What metric changed?',
      ),
    ).toBe(
      'The claimed result is not yet supported. Follow-up: What metric changed?',
    );
  });

  it('removes Markdown without corrupting literal technical punctuation', () => {
    expect(
      normalizeGuidanceText(
        '**Suggested Response:** I used `SELECT *` while comparing O(n * log n) behavior. See [the query plan](https://example.test).',
      ),
    ).toBe(
      'I used SELECT * while comparing O(n * log n) behavior. See the query plan.',
    );
  });

  it('uses a task-specific label for every session mode', () => {
    expect(guidanceLabelForMode('coach')).toBe('Suggested response');
    expect(guidanceLabelForMode('interviewer')).toBe('Follow-up question');
    expect(guidanceLabelForMode('defense')).toBe('Evidence check');
  });
});
