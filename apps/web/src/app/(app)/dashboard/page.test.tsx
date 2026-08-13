// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/auth/require-user-server.js', () => ({
  requireUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../lib/neon/database.js', () => ({
  getNeonSql: vi.fn(),
}));
vi.mock('../../../data/sessions/repository.js', () => ({
  asSessionSql: vi.fn((sql) => sql),
  listSessionsForOwner: vi.fn().mockResolvedValue([]),
}));
vi.mock('./actions.js', () => ({ signOut: vi.fn() }));

import DashboardPage from './page';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('presents a new session action and a consent-first empty state', async () => {
    render(await DashboardPage());

    const newSession = screen.getByRole('link', { name: 'New session' });

    expect(newSession).toHaveProperty(
      'href',
      expect.stringContaining('/sessions/new'),
    );
    expect(newSession.className).toContain('text-white');
    const createSession = screen.getByRole('link', {
      name: 'Create a session',
    });

    expect(createSession.className).toContain('bg-[#149c75]');
    expect(createSession.className).toContain('text-white');
    expect(
      screen.getByLabelText('Session activity visualization'),
    ).toBeTruthy();
    expect(
      screen.getByText('Always visible').parentElement?.className,
    ).toContain('items-center');
    expect(screen.getByText('No sessions yet')).toBeTruthy();
    expect(
      screen.getByText(/Capture only begins after you confirm consent/i),
    ).toBeTruthy();
  });
});
