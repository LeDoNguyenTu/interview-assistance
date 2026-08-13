// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/auth/require-user-server.js', () => ({
  requireUser: vi
    .fn()
    .mockResolvedValue({ email: 'owner@example.com', sub: 'owner-1' }),
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
  signOut: vi.fn(),
}));

import SettingsPage from './page';

afterEach(cleanup);

describe('SettingsPage', () => {
  it('makes visible capture guardrails and account-owned provider settings clear', async () => {
    render(await SettingsPage());

    expect(
      screen.getByRole('heading', {
        name: 'Account and workspace settings',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Visible capture only')).toBeTruthy();
    expect(screen.getByText('Immediate stop control')).toBeTruthy();
    expect(screen.getByLabelText('OpenAI API key')).toBeTruthy();
    expect(screen.getByText('Saved key ending in 7890')).toBeTruthy();
  });

  it('groups identity, password, two-factor status, and sign-out under account security', async () => {
    render(await SettingsPage());

    expect(
      screen.getByRole('heading', { name: 'Account and workspace settings' }),
    ).toBeTruthy();
    expect(screen.getByDisplayValue('owner@example.com')).toBeTruthy();
    expect(screen.getByLabelText('Current password')).toBeTruthy();
    expect(screen.getByLabelText('New password')).toBeTruthy();
    expect(screen.getByText('Two-factor authentication')).toBeTruthy();
    expect(screen.getByText('Not available')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });

  it('renders provider cards as equal-height responsive columns', async () => {
    render(await SettingsPage());

    const cards = ['OpenAI', 'Gemini'].map((name) =>
      screen.getByRole('heading', { level: 3, name }).closest('article'),
    );
    expect(cards).toHaveLength(2);
    expect(cards.every((card) => card?.className.includes('h-full'))).toBe(
      true,
    );
    expect(cards.every((card) => card?.className.includes('flex-col'))).toBe(
      true,
    );
    expect(cards[0]?.parentElement?.className).toContain('lg:grid-cols-2');
  });
});
