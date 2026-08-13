// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./actions.js', () => ({ signIn: vi.fn() }));

import SignInPage from './page.js';
import { SignInErrorAlert } from './sign-in-error-alert.js';

afterEach(cleanup);

describe('SignInPage', () => {
  it('presents the sign-in form inside a complete branded public page', async () => {
    render(await SignInPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('img', { name: 'CandorLens' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Sign in to CandorLens' }),
    ).toBeTruthy();
    expect(
      screen.getByText('Your interview workspace, ready when you are.'),
    ).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('renders a generic accessible authentication failure alert', async () => {
    render(<SignInErrorAlert error="auth" />);

    expect(screen.getByRole('alert').textContent).toBe(
      'We could not complete authentication. Please try again.',
    );
  });

  it('confirms successful email verification before sign-in', () => {
    render(<SignInErrorAlert error={undefined} verified="1" />);

    expect(screen.getByRole('status').textContent).toBe(
      'Email verified. Sign in to open your workspace.',
    );
  });
});
