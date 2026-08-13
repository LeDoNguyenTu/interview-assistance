'use client';

import { Button, Input, Label } from '@candorlens/ui';
import { useActionState } from 'react';

import type { ProviderAvailability } from '../../config/provider-types';

export type SessionFormState = {
  message: string | null;
  status: 'error' | 'idle';
};

const initialState: SessionFormState = { message: null, status: 'idle' };

type SessionFormProps = {
  action: (
    state: SessionFormState,
    formData: FormData,
  ) => Promise<SessionFormState>;
  providers: readonly ProviderAvailability[];
};

export function SessionForm({ action, providers }: SessionFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-[#e9f3ef]" htmlFor="title">
          Session title
        </Label>
        <Input
          autoComplete="off"
          className="border-white/15 bg-black/15 text-white shadow-none placeholder:text-[#719184] focus-visible:ring-offset-[#0a1d19]"
          id="title"
          maxLength={160}
          name="title"
          placeholder="Product design interview"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-[#e9f3ef]" htmlFor="mode">
          Interview mode
        </Label>
        <select
          className="min-h-12 w-full rounded-[var(--cl-radius-control)] border border-white/15 bg-black/15 px-4 py-2 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--cl-color-ring)] focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1d19]"
          defaultValue="coach"
          id="mode"
          name="mode"
        >
          <option value="coach">Coach</option>
          <option value="interviewer">Interviewer</option>
          <option value="defense">Defense</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label
          className="text-sm font-semibold text-[#e9f3ef]"
          htmlFor="provider"
        >
          Provider
        </Label>
        <select
          className="min-h-12 w-full rounded-[var(--cl-radius-control)] border border-white/15 bg-black/15 px-4 py-2 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[var(--cl-color-ring)] focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1d19]"
          defaultValue={providers.find((provider) => provider.available)?.id}
          id="provider"
          name="provider"
        >
          {providers.map((provider) => (
            <option
              disabled={!provider.available}
              key={provider.id}
              value={provider.id}
            >
              {provider.label}
            </option>
          ))}
        </select>
        <p className="text-sm leading-6 text-[#a8c0b6]">
          {providers
            .filter((provider) => !provider.available && provider.reason)
            .map((provider) => provider.reason)
            .join(' ')}
        </p>
      </div>
      <p
        aria-atomic="true"
        aria-live={state.status === 'error' ? 'assertive' : 'polite'}
        className="min-h-6 text-sm text-[#b9c9c4]"
        role={state.status === 'error' ? 'alert' : 'status'}
      >
        {isPending ? 'Creating draft session...' : state.message}
      </p>
      <Button
        className="min-h-12 rounded-2xl px-5 text-sm font-bold shadow-[0_18px_50px_rgb(31_194_142_/_26%)] hover:-translate-y-0.5 hover:brightness-110"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Creating draft session...' : 'Create draft session'}
      </Button>
    </form>
  );
}
