'use server';

import { redirect } from 'next/navigation';

import type { AuthActionState } from '../../../components/auth/auth-action-state';
import { getNeonAuth } from '../../../lib/auth/neon-auth';

function readCredentials(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    password.length < 8
  ) {
    return null;
  }

  return { email: email.trim().toLowerCase(), password };
}

export async function signIn(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  if (!credentials) {
    return {
      message: 'Enter a valid email address and password.',
      status: 'error',
    };
  }

  const { error } = await getNeonAuth().signIn.email(credentials);

  if (error) {
    return {
      message: 'Unable to sign in with those credentials.',
      status: 'error',
    };
  }

  redirect('/dashboard');
}

export async function signUp(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  if (!credentials) {
    return {
      message: 'Enter a valid email address and password.',
      status: 'error',
    };
  }

  const { error } = await getNeonAuth().signUp.email({
    ...credentials,
    name: credentials.email.split('@')[0] || 'CandorLens user',
  });

  if (error) {
    return {
      message: 'Unable to create an account with those credentials.',
      status: 'error',
    };
  }

  redirect(`/verify-email?email=${encodeURIComponent(credentials.email)}`);
}
