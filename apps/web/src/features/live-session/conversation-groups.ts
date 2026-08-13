import type { LiveTranscriptItem } from './live-session-machine';
import { isLikelyInterviewQuestion } from './question-detection';

export type ConversationGroup<T extends LiveTranscriptItem> = {
  id: string;
  question: T | null;
  questionNumber: number | null;
  turns: T[];
};

export function groupTranscriptByQuestion<T extends LiveTranscriptItem>(
  transcript: readonly T[],
): ConversationGroup<T>[] {
  const groups: ConversationGroup<T>[] = [];
  let questionNumber = 0;

  for (const item of transcript) {
    const beginsQuestion =
      item.speaker === 'Interviewer' && isLikelyInterviewQuestion(item.text);

    if (beginsQuestion) {
      questionNumber += 1;
      groups.push({
        id: item.id,
        question: item,
        questionNumber,
        turns: [],
      });
      continue;
    }

    const current = groups.at(-1);
    if (current) {
      current.turns.push(item);
      continue;
    }

    groups.push({
      id: `context-${item.id}`,
      question: null,
      questionNumber: null,
      turns: [item],
    });
  }

  return groups;
}
