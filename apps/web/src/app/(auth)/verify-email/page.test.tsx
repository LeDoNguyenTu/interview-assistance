// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./actions.js', () => ({
  resendVerificationCode: vi.fn(),
  verifyEmailCode: vi.fn(),
}));

import VerifyEmailPage from './page.js';

afterEach(cleanup);

describe('VerifyEmailPage', () => {
  it('centers email verification inside the complete public shell', async () => {
    render(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ email: 'person@example.com' }),
      }),
    );

    expect(screen.getByRole('img', { name: 'CandorLens' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Verify your email' }),
    ).toBeTruthy();
    expect(screen.getByText(/person@example.com/)).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
  });

  it('offers a safe recovery path when no valid email is present', async () => {
    render(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ email: 'bad' }),
      }),
    );

    expect(
      screen
        .getByRole('link', { name: 'Return to account creation' })
        .getAttribute('href'),
    ).toBe('/sign-up');
    expect(screen.queryByLabelText('Verification code')).toBeNull();
  });
});
