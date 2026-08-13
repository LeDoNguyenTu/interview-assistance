type TranscriptCandidate = {
  speaker: 'Interviewer' | 'Participant';
  text: string;
};

const questionOpening =
  /^(?:what|why|how|when|where|who|which|whose|can|could|would|will|do|does|did|are|is|was|were|have|has|had|may|might|should)\b/i;
const interviewPromptOpening =
  /^(?:(?:please\s+)?(?:tell\s+me|describe|explain|walk\s+me\s+through|talk\s+me\s+through|give\s+me\s+an?\s+example|share\s+an?\s+(?:example|time|experience))|i(?:'d|\s+would)\s+like\s+you\s+to\s+(?:tell|describe|explain|walk|share))\b/i;
const declarativeOpening =
  /^(?:what\s+i(?:'d|\s+would)\s+like\s+to\s+(?:do|cover|explain|share|say)|how\s+i\s+(?:see|view|understand)|what\s+(?:i|we)\s+(?:did|learned|found)|why\s+(?:i|we)\s+(?:decided|chose))\b/i;

export function isLikelyInterviewQuestion(value: string): boolean {
  const text = value.trim().replace(/^["'“”]+/, '');
  if (text.length < 4) return false;
  if (declarativeOpening.test(text)) return false;
  return (
    text.endsWith('?') ||
    questionOpening.test(text) ||
    interviewPromptOpening.test(text)
  );
}

export function latestInterviewerQuestion<T extends TranscriptCandidate>(
  transcript: readonly T[],
): T | null {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const item = transcript[index];
    if (
      item?.speaker === 'Interviewer' &&
      isLikelyInterviewQuestion(item.text)
    ) {
      return item;
    }
  }
  return null;
}
