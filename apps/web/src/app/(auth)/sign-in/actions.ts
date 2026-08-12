'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '../../../lib/supabase/server';

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

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

  const origin =
    (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_APP_URL;
  const supabase = await createClient();
  await supabase.auth.signUp({
    ...credentials,
    ...(origin
      ? {
          options: {
            emailRedirectTo: new URL(
              '/auth/callback?next=/dashboard',
              origin,
            ).toString(),
          },
        }
      : {}),
  });

  return {
    message: 'If an account can be created, check your email to continue.',
    status: 'success',
  };
}
