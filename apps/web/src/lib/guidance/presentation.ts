export type GuidanceMode = 'coach' | 'defense' | 'interviewer';

const presentationLabels: Record<GuidanceMode, string> = {
  coach: 'Suggested response',
  defense: 'Evidence check',
  interviewer: 'Follow-up question',
};

export function guidanceLabelForMode(mode: GuidanceMode): string {
  return presentationLabels[mode];
}

export function normalizeGuidanceText(value: string): string {
  const source = value
    .trim()
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+-{3,}\s+/g, ' ');
  const sectionPattern =
    /(?:suggested\s+(?:response|answer|reply|follow-up(?:\s+question)?|reflection\s+prompt)|recommended\s+(?:response|answer))\s*:\s*/gi;
  const sections = [...source.matchAll(sectionPattern)];
  const lastSection = sections.at(-1);
  const selected =
    lastSection?.index === undefined
      ? source
      : source.slice(lastSection.index + lastSection[0].length);

  return selected
    .replace(/^\*([\s\S]+)\*$/, '$1')
    .replace(/^_([\s\S]+)_$/, '$1')
    .replace(/^(?:session\s+)?draft\s+for\s+human\s+review\s*:?\s*/i, '')
    .replace(/^summary\s*:\s*/i, '')
    .replace(/^evidence\s+check\s*:\s*/i, '')
    .replace(/\s*follow-up\s+question\s*:\s*/i, ' Follow-up: ')
    .replace(/\s+/g, ' ')
    .trim();
}
