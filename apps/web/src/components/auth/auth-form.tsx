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
        <Label className="text-[#e7e7e1]" htmlFor="email">
          Email address
        </Label>
        <Input
          autoComplete="email"
          className="border-white/15 bg-white/[0.06] text-white placeholder:text-[#9e9e98] focus-visible:ring-offset-[#121212]"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-[#e7e7e1]" htmlFor="password">
          Password
        </Label>
        <Input
          autoComplete={isSignIn ? 'current-password' : 'new-password'}
          className="border-white/15 bg-white/[0.06] text-white placeholder:text-[#9e9e98] focus-visible:ring-offset-[#121212]"
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
        className="min-h-6 text-sm text-[#b7b7b1]"
        role={state.status === 'error' ? 'alert' : 'status'}
      >
        {isPending ? 'Please wait…' : state.message}
      </p>
      <Button
        className="min-h-12 w-full rounded-xl text-base font-bold shadow-[0_16px_42px_rgb(16_163_127_/_25%)]"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Please wait…' : isSignIn ? 'Sign in' : 'Create account'}
      </Button>
      <p className="text-sm text-[#b7b7b1]">
        {isSignIn ? 'Need an account? ' : 'Already have an account? '}
        <Link
          className="font-semibold text-[#5ee8bd] hover:text-white"
          href={isSignIn ? '/sign-up' : '/sign-in'}
        >
          {isSignIn ? 'Create one' : 'Sign in'}
        </Link>
      </p>
    </form>
  );
}
