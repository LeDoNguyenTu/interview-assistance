// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HomePage from './page.js';

afterEach(cleanup);

describe('HomePage', () => {
  it('presents CandorLens with one sign-in action and a consent-first introduction', () => {
    render(<HomePage />);

    const logo = screen.getByRole('img', { name: 'CandorLens' });
    expect(logo).toBeTruthy();
    expect(logo.className).toContain('w-[13rem]');
    const signInLinks = screen.getAllByRole('link', { name: 'Sign in' });

    expect(signInLinks).toHaveLength(1);
    expect(signInLinks.at(0)?.className).toContain('text-white');
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
