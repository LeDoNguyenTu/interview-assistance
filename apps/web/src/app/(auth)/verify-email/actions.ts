'use server';

import { redirect } from 'next/navigation';

import type { AuthActionState } from '../../../components/auth/auth-action-state';
import { getNeonAuth } from '../../../lib/auth/neon-auth';

function normalizeEmail(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  return email;
}

export async function verifyEmailCode(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get('email'));
  const rawOtp = formData.get('otp');
  const otp = typeof rawOtp === 'string' ? rawOtp.replace(/\s/g, '') : '';

  if (!email || !/^\d{6}$/.test(otp)) {
    return {
      message: 'Enter the six-digit code from your email.',
      status: 'error',
    };
  }

  let failed = false;
  try {
    const { error } = await getNeonAuth().emailOtp.verifyEmail({ email, otp });
    failed = Boolean(error);
  } catch {
    failed = true;
  }

  if (failed) {
    return {
      message:
        'That code could not be verified. Request a new code and try again.',
      status: 'error',
    };
  }

  redirect('/sign-in?verified=1');
}

export async function resendVerificationCode(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get('email'));
  if (!email) {
    return {
      message: 'Return to account creation and enter your email again.',
      status: 'error',
    };
  }

  try {
    const { error } = await getNeonAuth().emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    });

    if (error) {
      return {
        message: 'A new code could not be sent yet. Please try again shortly.',
        status: 'error',
      };
    }
  } catch {
    return {
      message: 'A new code could not be sent yet. Please try again shortly.',
      status: 'error',
    };
  }

  return {
    message: 'A new code is on its way. Check your inbox.',
    status: 'success',
  };
}
