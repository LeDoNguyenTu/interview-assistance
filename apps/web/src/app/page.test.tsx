// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HomePage from './page.js';

afterEach(cleanup);

describe('HomePage', () => {
  it('keeps sign in in the header and the single create-account action in the hero', () => {
    render(<HomePage />);

    const logo = screen.getByRole('img', { name: 'CandorLens' });
    expect(logo).toBeTruthy();
    expect(logo.className).toContain('sm:w-[14.5rem]');
    const header = screen.getAllByRole('banner')[0]!;
    const main = screen.getByRole('main');
    const signInLinks = screen.getAllByRole('link', { name: 'Sign in' });
    expect(signInLinks).toHaveLength(1);
    expect(within(header).getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(
      within(header).queryByRole('link', { name: 'Create account' }),
    ).toBeNull();
    expect(
      within(main).getByRole('link', { name: 'Create account' }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'A consent-first interview workspace for clearer practice, structured conversations, and evidence-oriented review.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByText('\u00A9 2026 CandorLens')).toBeTruthy();
  });

  it('does not offer capture controls before authentication', () => {
    render(<HomePage />);

    expect(screen.queryByRole('button', { name: /capture/i })).toBeNull();
  });
});
