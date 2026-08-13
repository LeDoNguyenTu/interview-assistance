import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const dependencies = vi.hoisted(() => ({
  asSessionSql: vi.fn((sql) => sql),
  createDraftSession: vi.fn(),
  getNeonSql: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: dependencies.redirect }));
vi.mock('../../../../data/sessions/repository', () => ({
  SessionInputError: class SessionInputError extends Error {},
  asSessionSql: dependencies.asSessionSql,
  createDraftSession: dependencies.createDraftSession,
}));
vi.mock('../../../../lib/auth/require-user-server', () => ({
  requireUser: dependencies.requireUser,
}));
vi.mock('../../../../lib/neon/database', () => ({
  getNeonSql: dependencies.getNeonSql,
}));

import { createSession } from './actions.js';

const initialState = { message: null, status: 'idle' as const };

function sessionFormData() {
  const formData = new FormData();
  formData.set('title', 'Architecture practice');
  formData.set('mode', 'coach');
  return formData;
}

describe('createSession', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dependencies.requireUser.mockResolvedValue({
      sub: '11111111-1111-1111-1111-111111111111',
    });
    dependencies.getNeonSql.mockReturnValue({});
    dependencies.redirect.mockImplementation((path: string): never => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it('propagates the Next redirect to the created session detail route', async () => {
    dependencies.createDraftSession.mockResolvedValue({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });

    await expect(
      createSession(initialState, sessionFormData()),
    ).rejects.toThrow(
      'NEXT_REDIRECT:/sessions/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
  });

  it('returns a safe generic form error when the repository fails', async () => {
    dependencies.createDraftSession.mockRejectedValue(
      new Error('database connection details'),
    );

    await expect(
      createSession(initialState, sessionFormData()),
    ).resolves.toEqual({
      message: 'We could not create this draft. Please try again.',
      status: 'error',
    });
  });
});
