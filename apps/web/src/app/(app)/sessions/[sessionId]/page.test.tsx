// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { SessionRecord } from '@candorlens/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

const session: SessionRecord = {
  captureSources: [],
  consentedAt: null,
  createdAt: '2026-08-13T00:00:00.000Z',
  endedAt: null,
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  mode: 'interviewer',
  ownerId: 'owner-1',
  providerId: 'fixture',
  startedAt: null,
  status: 'draft',
  title: 'Architecture interview',
  updatedAt: '2026-08-13T00:00:00.000Z',
};

const dependencies = vi.hoisted(() => ({
  getNeonSql: vi.fn(),
  getSessionForOwner: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({ notFound: vi.fn() }));
vi.mock('../../../../data/sessions/repository', () => ({
  asSessionSql: (sql: unknown) => sql,
  getSessionForOwner: dependencies.getSessionForOwner,
}));
vi.mock('../../../../lib/auth/require-user-server', () => ({
  requireUser: dependencies.requireUser,
}));
vi.mock('../../../../lib/neon/database', () => ({
  getNeonSql: dependencies.getNeonSql,
}));

import SessionDetailPage from './page';

afterEach(cleanup);

describe('SessionDetailPage', () => {
  it('mounts the visible live-session workspace for an owner-scoped session', async () => {
    dependencies.getNeonSql.mockReturnValue({});
    dependencies.getSessionForOwner.mockResolvedValue(session);
    dependencies.requireUser.mockResolvedValue({ sub: 'owner-1' });

    render(
      await SessionDetailPage({
        params: Promise.resolve({ sessionId: session.id }),
      }),
    );

    expect(screen.getByLabelText('Live session workspace')).toBeTruthy();
    expect(screen.getByText('Select audio sources.')).toBeTruthy();
  });
});
