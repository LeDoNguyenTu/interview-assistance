'use client';

import { Button, Input, Label } from '@candorlens/ui';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { neonAuthClient } from '../../lib/auth/neon-auth-client';

type FormStatus = {
  message: string | null;
  tone: 'error' | 'idle' | 'success';
};

const idleStatus: FormStatus = { message: null, tone: 'idle' };

type AccountSecurityPanelProps = {
  email: string;
  signOutAction: () => Promise<void>;
};

function StatusMessage({ status }: Readonly<{ status: FormStatus }>) {
  return (
    <p
      aria-live={status.tone === 'error' ? 'assertive' : 'polite'}
      className={
        status.tone === 'error'
          ? 'min-h-6 text-sm leading-6 text-[#ffd7dd]'
          : status.tone === 'success'
            ? 'min-h-6 text-sm leading-6 text-[#a8f0ce]'
            : 'min-h-6 text-sm leading-6 text-[#a8c0b6]'
      }
      role={status.tone === 'error' ? 'alert' : 'status'}
    >
      {status.message}
    </p>
  );
}

const fieldClassName =
  'border-white/15 bg-black/15 text-white shadow-none placeholder:text-[#719184] focus-visible:ring-offset-[#0a1d19]';

export function AccountSecurityPanel({
  email,
  signOutAction,
}: Readonly<AccountSecurityPanelProps>) {
  const [emailStatus, setEmailStatus] = useState<FormStatus>(idleStatus);
  const [passwordStatus, setPasswordStatus] = useState<FormStatus>(idleStatus);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function updateEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newEmail = formData.get('email');

    if (
      typeof newEmail !== 'string' ||
      !newEmail.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ) {
      setEmailStatus({
        message: 'Enter a valid email address.',
        tone: 'error',
      });
      return;
    }

    setSavingEmail(true);
    setEmailStatus(idleStatus);
    try {
      const { error } = await neonAuthClient.changeEmail({
        callbackURL: '/settings',
        newEmail: newEmail.trim(),
      });
      setEmailStatus(
        error
          ? {
              message: 'Unable to start the email change. Please try again.',
              tone: 'error',
            }
          : {
              message: 'Check your new email address to confirm the change.',
              tone: 'success',
            },
      );
    } catch {
      setEmailStatus({
        message: 'Unable to start the email change. Please try again.',
        tone: 'error',
      });
    } finally {
      setSavingEmail(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmation = formData.get('confirmation');

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      currentPassword.length < 8 ||
      newPassword.length < 8
    ) {
      setPasswordStatus({
        message: 'Both passwords must contain at least 8 characters.',
        tone: 'error',
      });
      return;
    }

    if (newPassword !== confirmation) {
      setPasswordStatus({
        message: 'The new passwords do not match.',
        tone: 'error',
      });
      return;
    }

    setSavingPassword(true);
    setPasswordStatus(idleStatus);
    try {
      const { error } = await neonAuthClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        setPasswordStatus({
          message:
            'Unable to update the password. Check your current password.',
          tone: 'error',
        });
        return;
      }

      form.reset();
      setPasswordStatus({
        message: 'Password updated successfully.',
        tone: 'success',
      });
    } catch {
      setPasswordStatus({
        message: 'Unable to update the password. Please try again.',
        tone: 'error',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-2">
      <article className="flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_24px_80px_rgb(0_0_0_/_18%)] sm:p-7">
        <div className="min-h-28">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#83dcb4]">
            Identity
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-white">
            Email address
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#b9c9c4]">
            Changing your sign-in email requires confirmation at the new
            address.
          </p>
        </div>
        <form
          className="mt-6 flex flex-1 flex-col gap-4"
          onSubmit={updateEmail}
        >
          <div className="space-y-2">
            <Label
              className="text-sm font-semibold text-[#e9f3ef]"
              htmlFor="account-email"
            >
              Email address
            </Label>
            <Input
              autoComplete="email"
              className={fieldClassName}
              defaultValue={email}
              id="account-email"
              name="email"
              required
              type="email"
            />
          </div>
          <StatusMessage status={emailStatus} />
          <Button
            className="mt-auto min-h-12 w-full rounded-xl text-base font-bold"
            disabled={savingEmail}
            type="submit"
          >
            {savingEmail ? 'Sending confirmation...' : 'Change email'}
          </Button>
        </form>
      </article>

      <article className="flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_24px_80px_rgb(0_0_0_/_18%)] sm:p-7">
        <div className="min-h-28">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#83dcb4]">
            Credentials
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-white">
            Password
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#b9c9c4]">
            A password change signs out your other browser sessions.
          </p>
        </div>
        <form
          className="mt-6 flex flex-1 flex-col gap-4"
          onSubmit={updatePassword}
        >
          <div className="space-y-2">
            <Label
              className="text-sm font-semibold text-[#e9f3ef]"
              htmlFor="current-password"
            >
              Current password
            </Label>
            <Input
              autoComplete="current-password"
              className={fieldClassName}
              id="current-password"
              minLength={8}
              name="currentPassword"
              required
              type="password"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-[#e9f3ef]"
                htmlFor="new-password"
              >
                New password
              </Label>
              <Input
                autoComplete="new-password"
                className={fieldClassName}
                id="new-password"
                minLength={8}
                name="newPassword"
                required
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-[#e9f3ef]"
                htmlFor="confirm-password"
              >
                Confirm new password
              </Label>
              <Input
                autoComplete="new-password"
                className={fieldClassName}
                id="confirm-password"
                minLength={8}
                name="confirmation"
                required
                type="password"
              />
            </div>
          </div>
          <StatusMessage status={passwordStatus} />
          <Button
            className="mt-auto min-h-12 w-full rounded-xl text-base font-bold"
            disabled={savingPassword}
            type="submit"
          >
            {savingPassword ? 'Updating password...' : 'Change password'}
          </Button>
        </form>
      </article>

      <article className="flex min-h-60 flex-col rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_20px_70px_rgb(0_0_0_/_16%)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#83dcb4]">
              Additional protection
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-white">
              Two-factor authentication
            </h3>
          </div>
          <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.09em] text-[#ffe1a6]">
            Not available
          </span>
        </div>
        <p className="mt-5 max-w-xl text-sm leading-6 text-[#b9c9c4]">
          This Neon Auth deployment does not currently expose application-level
          authenticator setup. The control will remain unavailable until the
          authentication endpoint supports it.
        </p>
      </article>

      <article className="flex min-h-60 flex-col rounded-[1.5rem] border border-rose-200/15 bg-[#241415]/90 p-6 shadow-[0_20px_70px_rgb(0_0_0_/_16%)] sm:p-7">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#ffb5bd]">
          Session access
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-white">
          Sign out
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#d6bfc1]">
          End this browser session and return to the public sign-in page.
        </p>
        <form action={signOutAction} className="mt-auto pt-6">
          <button
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-rose-200/25 bg-rose-300/10 px-5 text-base font-bold text-white transition-[background-color,border-color] duration-200 hover:border-rose-200/40 hover:bg-rose-300/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffabb5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241415]"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </article>
    </div>
  );
}
