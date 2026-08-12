// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/auth/require-user-server.js', () => ({
  requireUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../lib/supabase/server.js', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));
vi.mock('../../../data/sessions/repository.js', () => ({
  listSessionsForOwner: vi.fn().mockResolvedValue([]),
}));
vi.mock('./actions.js', () => ({ signOut: vi.fn() }));

import DashboardPage from './page';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('presents a new session action and a consent-first empty state', async () => {
    render(await DashboardPage());

    expect(screen.getByRole('link', { name: 'New session' })).toHaveProperty(
      'href',
      expect.stringContaining('/sessions/new'),
    );
    expect(screen.getByText('No sessions yet')).toBeTruthy();
    expect(
      screen.getByText(/Capture only begins after you confirm consent/i),
    ).toBeTruthy();
  });
});
