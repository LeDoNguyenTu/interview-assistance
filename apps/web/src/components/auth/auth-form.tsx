'use client';

import { Button, Input, Label } from '@candorlens/ui';
import Link from 'next/link';
import { useActionState } from 'react';

type AuthFormState = {
  message: string | null;
  status: 'error' | 'success' | 'idle';
};

const initialAuthFormState: AuthFormState = { message: null, status: 'idle' };

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  mode: 'sign-in' | 'sign-up';
};

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialAuthFormState,
  );
  const isSignIn = mode === 'sign-in';

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete={isSignIn ? 'current-password' : 'new-password'}
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>
      <p
        aria-atomic="true"
        aria-live={state.status === 'error' ? 'assertive' : 'polite'}
        className="min-h-6 text-sm text-[var(--cl-color-muted-foreground)]"
        role={state.status === 'error' ? 'alert' : 'status'}
      >
        {isPending ? 'Please wait…' : state.message}
      </p>
      <Button disabled={isPending} type="submit">
        {isPending ? 'Please wait…' : isSignIn ? 'Sign in' : 'Create account'}
      </Button>
      <p className="text-sm text-[var(--cl-color-muted-foreground)]">
        {isSignIn ? 'Need an account? ' : 'Already have an account? '}
        <Link
          className="font-semibold text-[var(--cl-color-primary)] hover:text-[var(--cl-color-primary-hover)]"
          href={isSignIn ? '/sign-up' : '/sign-in'}
        >
          {isSignIn ? 'Create one' : 'Sign in'}
        </Link>
      </p>
    </form>
  );
}
