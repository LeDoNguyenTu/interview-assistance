// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HomePage from './page.js';

afterEach(cleanup);

describe('HomePage', () => {
  it('presents CandorLens with one sign-in action and a consent-first introduction', () => {
    render(<HomePage />);

    expect(screen.getByText('CandorLens')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Sign in' })).toHaveLength(1);
    expect(
      screen.getByText(
        'A consent-first interview workspace for clearer practice, structured conversations, and evidence-oriented review.',
      ),
    ).toBeTruthy();
  });

  it('does not offer capture controls before authentication', () => {
    render(<HomePage />);

    expect(screen.queryByRole('button', { name: /capture/i })).toBeNull();
  });
});
