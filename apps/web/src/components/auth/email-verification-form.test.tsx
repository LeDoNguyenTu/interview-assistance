// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EmailVerificationForm } from './email-verification-form.js';

afterEach(cleanup);

describe('EmailVerificationForm', () => {
  it('presents an accessible one-time code field and resend action', () => {
    render(
      <EmailVerificationForm
        email="person@example.com"
        resendAction={vi.fn()}
        verifyAction={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Verification code');
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('maxlength')).toBe('6');
    expect(screen.getByRole('button', { name: 'Verify email' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeTruthy();
  });
});
