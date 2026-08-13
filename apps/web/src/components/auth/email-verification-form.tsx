'use client';

import { Button, Input, Label } from '@candorlens/ui';
import Link from 'next/link';
import { useActionState } from 'react';

import {
  initialAuthActionState,
  type AuthActionState,
} from './auth-action-state';

type EmailVerificationFormProps = {
  email: string;
  resendAction: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  verifyAction: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
};

export function EmailVerificationForm({
  email,
  resendAction,
  verifyAction,
}: Readonly<EmailVerificationFormProps>) {
  const [verifyState, verifyFormAction, isVerifying] = useActionState(
    verifyAction,
    initialAuthActionState,
  );
  const [resendState, resendFormAction, isResending] = useActionState(
    resendAction,
    initialAuthActionState,
  );
  const isPending = isVerifying || isResending;

  return (
    <div className="space-y-6">
      <form action={verifyFormAction} className="space-y-5" noValidate>
        <input name="email" type="hidden" value={email} />
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-[#e7e7e1]" htmlFor="otp">
              Verification code
            </Label>
            <span className="font-mono text-xs text-[#82e7bd]">6 digits</span>
          </div>
          <Input
            autoComplete="one-time-code"
            autoFocus
            className="h-16 border-white/15 bg-white/[0.06] text-center font-mono text-2xl font-semibold tracking-[0.42em] text-white placeholder:text-[#69736f] focus-visible:ring-[#78ecc0] focus-visible:ring-offset-[#101815]"
            id="otp"
            inputMode="numeric"
            maxLength={6}
            name="otp"
            pattern="[0-9]{6}"
            placeholder="000000"
            required
          />
        </div>
        <p
          aria-atomic="true"
          aria-live={verifyState.status === 'error' ? 'assertive' : 'polite'}
          className={`min-h-6 text-sm leading-6 ${
            verifyState.status === 'error'
              ? 'text-[#ff9d95]'
              : verifyState.status === 'success'
                ? 'text-[#82e7bd]'
                : 'text-[#aebdb7]'
          }`}
          role={verifyState.status === 'error' ? 'alert' : 'status'}
        >
          {isVerifying ? 'Verifying your code...' : verifyState.message}
        </p>
        <Button
          className="min-h-12 w-full rounded-xl text-base font-bold shadow-[0_16px_42px_rgb(16_163_127_/_25%)]"
          disabled={isPending}
          type="submit"
        >
          {isVerifying ? 'Verifying...' : 'Verify email'}
        </Button>
      </form>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm leading-6 text-[#aebdb7]">
            Code not in your inbox?
          </p>
          <p
            aria-live={resendState.status === 'error' ? 'assertive' : 'polite'}
            className={`mt-1 max-w-xs text-xs leading-5 ${
              resendState.status === 'error'
                ? 'text-[#ff9d95]'
                : 'text-[#82e7bd]'
            }`}
            role={resendState.status === 'error' ? 'alert' : 'status'}
          >
            {isResending ? 'Sending a fresh code...' : resendState.message}
          </p>
        </div>
        <form action={resendFormAction}>
          <input name="email" type="hidden" value={email} />
          <Button
            className="min-h-11 border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.11]"
            disabled={isPending}
            type="submit"
            variant="secondary"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </Button>
        </form>
      </div>

      <Link
        className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[#82e7bd] transition-colors hover:text-white focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78ecc0]"
        href="/sign-up"
      >
        Use a different email
      </Link>
    </div>
  );
}
