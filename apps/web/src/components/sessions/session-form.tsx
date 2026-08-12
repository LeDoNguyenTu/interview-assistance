'use client';

import { Button, Input, Label } from '@candorlens/ui';
import { useActionState } from 'react';

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
};

export function SessionForm({ action }: SessionFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">Session title</Label>
        <Input
          autoComplete="off"
          id="title"
          maxLength={160}
          name="title"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mode">Interview mode</Label>
        <select
          className="min-h-11 w-full rounded-[var(--cl-radius-control)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] px-4 py-2 text-sm text-[var(--cl-color-foreground)] shadow-[var(--cl-shadow-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
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
        <Label htmlFor="provider">Provider</Label>
        <Input
          id="provider"
          name="provider"
          readOnly
          value="Fixture provider"
        />
        <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
          Fixture provider is used for this foundation workspace. No live
          provider traffic will start.
        </p>
      </div>
      <p
        aria-atomic="true"
        aria-live={state.status === 'error' ? 'assertive' : 'polite'}
        className="min-h-6 text-sm text-[var(--cl-color-muted-foreground)]"
        role={state.status === 'error' ? 'alert' : 'status'}
      >
        {isPending ? 'Creating draft session...' : state.message}
      </p>
      <Button disabled={isPending} type="submit">
        {isPending ? 'Creating draft session...' : 'Create draft session'}
      </Button>
    </form>
  );
}
