import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  asLiveSessionSql: vi.fn((sql) => sql),
  asProviderCredentialSql: vi.fn((sql) => sql),
  asSessionSql: vi.fn((sql) => sql),
  getNeonSql: vi.fn(() => 'neon-sql'),
  getSessionForOwner: vi.fn(),
  resolveProviderRuntimeEnvironment: vi.fn().mockResolvedValue(process.env),
  saveGuidanceEvent: vi.fn().mockResolvedValue(true),
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
vi.mock('../../../data/sessions/repository.js', () => ({
  asSessionSql: dependencies.asSessionSql,
  getSessionForOwner: dependencies.getSessionForOwner,
}));
vi.mock('../../../data/live-session/repository.js', () => ({
  asLiveSessionSql: dependencies.asLiveSessionSql,
  saveGuidanceEvent: dependencies.saveGuidanceEvent,
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

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.mocked(getAuthenticatedUser).mockResolvedValue({ sub: 'owner-1' });
  dependencies.getSessionForOwner.mockResolvedValue({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    mode: 'interviewer',
    title: 'Product interview',
  });
  dependencies.resolveProviderRuntimeEnvironment.mockResolvedValue(process.env);
  dependencies.saveGuidanceEvent.mockResolvedValue(true);
});

const payload = {
  mode: 'interviewer',
  notes: [],
  provider: 'openai',
  sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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
    expect(dependencies.saveGuidanceEvent).toHaveBeenCalledWith(
      'neon-sql',
      { sub: 'owner-1' },
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      expect.objectContaining({
        provider: 'openai',
        text: 'Ask how they measured the trade-off.',
      }),
    );
  });

  it('does not call a provider for a session the authenticated user does not own', async () => {
    dependencies.getSessionForOwner.mockResolvedValueOnce(null);

    const response = await POST(
      new Request('https://candorlens.test/api/guidance', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(404);
    expect(
      dependencies.resolveProviderRuntimeEnvironment,
    ).not.toHaveBeenCalled();
  });
});
