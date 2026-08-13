import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  asProviderCredentialSql: vi.fn((sql) => sql),
  asSessionSql: vi.fn((sql) => sql),
  getNeonSql: vi.fn(() => 'neon-sql'),
  getSessionForOwner: vi.fn(),
  resolveProviderRuntimeEnvironment: vi.fn(),
  transcribeAudio: vi.fn(),
}));

vi.mock('../../../../../lib/auth/neon-auth.js', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../../../lib/neon/database.js', () => ({
  getNeonSql: dependencies.getNeonSql,
}));
vi.mock('../../../../../data/sessions/repository.js', () => ({
  asSessionSql: dependencies.asSessionSql,
  getSessionForOwner: dependencies.getSessionForOwner,
}));
vi.mock('../../../../../data/provider-credentials/repository.js', () => ({
  asProviderCredentialSql: dependencies.asProviderCredentialSql,
}));
vi.mock('../../../../../data/provider-credentials/runtime.js', () => ({
  resolveProviderRuntimeEnvironment:
    dependencies.resolveProviderRuntimeEnvironment,
}));
vi.mock('../../../../../lib/transcription/dispatcher.js', () => ({
  TranscriptionDispatcherError: class TranscriptionDispatcherError extends Error {},
  transcribeAudio: dependencies.transcribeAudio,
}));

import { getAuthenticatedUser } from '../../../../../lib/auth/neon-auth';
import { POST } from './route';

const context = {
  params: Promise.resolve({
    sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  }),
};

function audioRequest(
  file = new File(['audio'], 'segment.webm', { type: 'audio/webm' }),
) {
  const form = new FormData();
  form.set('audio', file);
  return new Request(
    'https://candorlens.test/api/sessions/session/transcribe',
    {
      body: form,
      method: 'POST',
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuthenticatedUser).mockResolvedValue({ sub: 'owner-1' });
  dependencies.getSessionForOwner.mockResolvedValue({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    consentedAt: '2026-08-14T00:00:00.000Z',
    captureSources: ['microphone'],
    providerId: 'openai',
  });
  dependencies.resolveProviderRuntimeEnvironment.mockResolvedValue({
    OPENAI_API_KEY: 'owner-key',
  });
  dependencies.transcribeAudio.mockResolvedValue({
    provider: 'openai',
    text: 'What changed after launch?',
  });
});

describe('POST session transcription', () => {
  it('requires authentication before reading audio', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);
    const response = await POST(audioRequest(), context);
    expect(response.status).toBe(401);
    expect(dependencies.transcribeAudio).not.toHaveBeenCalled();
  });

  it('uses the owner-scoped session provider and decrypted environment', async () => {
    const response = await POST(audioRequest(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(dependencies.resolveProviderRuntimeEnvironment).toHaveBeenCalledWith(
      'neon-sql',
      { sub: 'owner-1' },
      'openai',
      process.env,
    );
    expect(dependencies.transcribeAudio).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'audio/webm', provider: 'openai' }),
      expect.objectContaining({ env: { OPENAI_API_KEY: 'owner-key' } }),
    );
    await expect(response.json()).resolves.toEqual({
      provider: 'openai',
      text: 'What changed after launch?',
    });
  });

  it('rejects unsupported audio and sessions not owned by the caller', async () => {
    const invalid = await POST(
      audioRequest(new File(['x'], 'segment.txt', { type: 'text/plain' })),
      context,
    );
    expect(invalid.status).toBe(400);

    dependencies.getSessionForOwner.mockResolvedValueOnce(null);
    const unavailable = await POST(audioRequest(), context);
    expect(unavailable.status).toBe(404);
  });

  it('rejects transcription when consent is not durably recorded', async () => {
    dependencies.getSessionForOwner.mockResolvedValueOnce({
      consentedAt: null,
      captureSources: [],
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      providerId: 'openai',
    });

    const response = await POST(audioRequest(), context);
    expect(response.status).toBe(409);
    expect(dependencies.transcribeAudio).not.toHaveBeenCalled();
  });

  it('accepts browser codec parameters on supported webm audio', async () => {
    const response = await POST(
      audioRequest(
        new File(['audio'], 'segment.webm', {
          type: 'audio/webm;codecs=opus',
        }),
      ),
      context,
    );

    expect(response.status).toBe(200);
  });
});
