// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/auth/require-user-server.js', () => ({
  requireUser: vi.fn().mockResolvedValue({ sub: 'owner-1' }),
}));
vi.mock('../../../lib/neon/database.js', () => ({ getNeonSql: vi.fn() }));
vi.mock('../../../data/provider-credentials/repository.js', () => ({
  asProviderCredentialSql: vi.fn().mockReturnValue('provider-sql'),
  listProviderCredentialSummaries: vi.fn().mockResolvedValue([
    {
      keyHint: '7890',
      model: 'gpt-4.1-mini',
      provider: 'openai',
      updatedAt: '2026-08-14T00:00:00.000Z',
    },
  ]),
}));
vi.mock('./actions.js', () => ({
  saveProviderSettings: vi.fn(),
}));

import SettingsPage from './page';

afterEach(cleanup);

describe('SettingsPage', () => {
  it('makes visible capture guardrails and account-owned provider settings clear', async () => {
    render(await SettingsPage());

    expect(
      screen.getByRole('heading', { name: 'Workspace settings' }),
    ).toBeTruthy();
    expect(screen.getByText('Visible capture only')).toBeTruthy();
    expect(screen.getByText('Immediate stop control')).toBeTruthy();
    expect(screen.getByLabelText('OpenAI API key')).toBeTruthy();
    expect(screen.getByText('Saved key ending in 7890')).toBeTruthy();
  });
});
