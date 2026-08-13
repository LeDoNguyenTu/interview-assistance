// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../lib/auth/require-user-server.js', () => ({
  requireUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../../lib/neon/database.js', () => ({
  getNeonSql: vi.fn(),
}));
vi.mock('../../../../data/provider-credentials/repository.js', () => ({
  asProviderCredentialSql: vi.fn().mockReturnValue('provider-sql'),
  listProviderCredentialSummaries: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../../../config/providers.js', () => ({
  getProviderAvailability: vi.fn().mockReturnValue([
    {
      available: true,
      id: 'fixture',
      label: 'Fixture preview',
      reason: null,
    },
  ]),
}));
vi.mock('./actions.js', () => ({ createSession: vi.fn() }));

import NewSessionPage from './page';

afterEach(cleanup);

describe('NewSessionPage', () => {
  it('centers the setup composition and gives back navigation a visible surface', async () => {
    render(await NewSessionPage());

    const backLink = screen.getByRole('link', { name: 'Back to sessions' });
    const container = screen.getByTestId('session-page-frame');

    expect(container.className).toContain('mx-auto');
    expect(container.className).toContain('max-w-6xl');
    expect(backLink.className).toContain('border-white/20');
    expect(backLink.querySelector('svg')).toBeTruthy();
  });
});
