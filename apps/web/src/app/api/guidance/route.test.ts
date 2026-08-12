import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/supabase/server.js', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));
vi.mock('../../../lib/auth/require-user.js', () => ({
  getValidatedClaims: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../lib/guidance/dispatcher.js', () => ({
  GuidanceDispatcherError: class GuidanceDispatcherError extends Error {},
  generateGuidance: vi.fn().mockResolvedValue({
    provider: 'openai',
    text: 'Ask how they measured the trade-off.',
  }),
}));

import { POST } from './route';

const payload = {
  mode: 'interviewer',
  notes: [],
  provider: 'openai',
  title: 'Product interview',
  transcript: [
    {
      speaker: 'Interviewer',
      text: 'Tell me about a decision.',
      timestamp: '00:18',
    },
  ],
};

describe('POST /api/guidance', () => {
  it('returns a no-store human-review draft for an authenticated request', async () => {
    const response = await POST(
      new Request('https://candorlens.test/api/guidance', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      provider: 'openai',
      text: 'Ask how they measured the trade-off.',
    });
  });
});
