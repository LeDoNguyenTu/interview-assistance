// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { changeEmail, changePassword } = vi.hoisted(() => ({
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('../../lib/auth/neon-auth-client.js', () => ({
  neonAuthClient: { changeEmail, changePassword },
}));

import { AccountSecurityPanel } from './account-security-panel';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AccountSecurityPanel', () => {
  it('submits a verified email-change request through the authenticated client', async () => {
    changeEmail.mockResolvedValue({ data: { status: true }, error: null });
    render(
      <AccountSecurityPanel
        email="owner@example.com"
        signOutAction={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.submit(screen.getByLabelText('Email address').closest('form')!);

    await waitFor(() =>
      expect(changeEmail).toHaveBeenCalledWith({
        callbackURL: '/settings',
        newEmail: 'new@example.com',
      }),
    );
    expect(
      await screen.findByText(
        'Check your new email address to confirm the change.',
      ),
    ).toBeTruthy();
  });

  it('changes the password and revokes other sessions', async () => {
    changePassword.mockResolvedValue({ data: {}, error: null });
    render(
      <AccountSecurityPanel
        email="owner@example.com"
        signOutAction={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'current-password' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'new-password-123' },
    });
    fireEvent.submit(
      screen.getByLabelText('Current password').closest('form')!,
    );

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'current-password',
        newPassword: 'new-password-123',
        revokeOtherSessions: true,
      }),
    );
    expect(
      await screen.findByText('Password updated successfully.'),
    ).toBeTruthy();
  });

  it('does not pretend unsupported two-factor setup is active', () => {
    render(
      <AccountSecurityPanel
        email="owner@example.com"
        signOutAction={vi.fn()}
      />,
    );

    expect(screen.getByText('Two-factor authentication')).toBeTruthy();
    expect(screen.getByText('Not available')).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: 'Enable two-factor authentication',
      }),
    ).toBeNull();
  });

  it('recovers from an unavailable authentication service', async () => {
    changeEmail.mockRejectedValue(new Error('network unavailable'));
    render(
      <AccountSecurityPanel
        email="owner@example.com"
        signOutAction={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.submit(screen.getByLabelText('Email address').closest('form')!);

    expect(
      await screen.findByText(
        'Unable to start the email change. Please try again.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Change email' }),
    ).not.toHaveProperty('disabled', true);
  });
});
