import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  asProviderCredentialSql: vi.fn((sql) => sql),
  getNeonSql: vi.fn(() => 'neon-sql'),
  resolveProviderRuntimeEnvironment: vi.fn().mockResolvedValue(process.env),
}));

vi.mock('../../../lib/auth/neon-auth.js', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../data/provider-credentials/repository.js', () => ({
  asProviderCredentialSql: dependencies.asProviderCredentialSql,
}));
vi.mock('../../../data/provider-credentials/runtime.js', () => ({
  resolveProviderRuntimeEnvironment:
    dependencies.resolveProviderRuntimeEnvironment,
}));
vi.mock('../../../lib/neon/database.js', () => ({
  getNeonSql: dependencies.getNeonSql,
}));
vi.mock('../../../lib/guidance/dispatcher.js', () => ({
  GuidanceDispatcherError: class GuidanceDispatcherError extends Error {},
  generateGuidance: vi.fn().mockResolvedValue({
    provider: 'openai',
    text: 'Ask how they measured the trade-off.',
  }),
}));

import { POST } from './route';
import { getAuthenticatedUser } from '../../../lib/auth/neon-auth';

afterEach(() => {
  vi.mocked(getAuthenticatedUser).mockResolvedValue({ sub: 'owner-1' });
  dependencies.resolveProviderRuntimeEnvironment.mockResolvedValue(process.env);
});

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
  it('rejects an unauthenticated request without calling a provider', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);

    const response = await POST(
      new Request('https://candorlens.test/api/guidance', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

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
    expect(dependencies.resolveProviderRuntimeEnvironment).toHaveBeenCalledWith(
      'neon-sql',
      { sub: 'owner-1' },
      'openai',
      process.env,
    );
    await expect(response.json()).resolves.toEqual({
      provider: 'openai',
      text: 'Ask how they measured the trade-off.',
    });
  });
});
