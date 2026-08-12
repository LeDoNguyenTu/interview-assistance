'use server';

import { redirect } from 'next/navigation';

import { getNeonAuth } from '../../../lib/auth/neon-auth';

type AuthFormState = {
  message: string | null;
  status: 'error' | 'success' | 'idle';
};

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

  return { email: email.trim(), password };
}

export async function signIn(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
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
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
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

  return {
    message: 'If an account can be created, check your email to continue.',
    status: 'success',
  };
}
