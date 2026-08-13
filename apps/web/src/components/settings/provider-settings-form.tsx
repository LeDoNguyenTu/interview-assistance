'use client';

import { Button, Input, Label } from '@candorlens/ui';
import { useActionState } from 'react';

import type { ConfigurableProvider } from '../../data/provider-credentials/input';

export type ProviderCredentialSummary = {
  keyHint: string;
  model: string;
  provider: ConfigurableProvider;
};

export type ProviderSettingsFormState = {
  message: string | null;
  status: 'error' | 'idle' | 'success';
};

const initialState: ProviderSettingsFormState = {
  message: null,
  status: 'idle',
};

type ProviderSettingsFormProps = {
  action: (
    state: ProviderSettingsFormState,
    formData: FormData,
  ) => Promise<ProviderSettingsFormState>;
  credential: ProviderCredentialSummary | null;
  provider: ConfigurableProvider;
};

const providerNames: Record<ConfigurableProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
};

const modelPlaceholders: Record<ConfigurableProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4.1-mini',
};

export function ProviderSettingsForm({
  action,
  credential,
  provider,
}: Readonly<ProviderSettingsFormProps>) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const providerName = providerNames[provider];
  const keyFieldId = `${provider}-api-key`;
  const modelFieldId = `${provider}-model`;

  return (
    <form action={formAction} className="mt-6 space-y-5" noValidate>
      <input name="provider" type="hidden" value={provider} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
        <p className="text-sm font-medium text-white">
          {credential
            ? `Saved key ending in ${credential.keyHint}`
            : 'No key saved yet'}
        </p>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-[#9df0cb]">
          {credential ? 'Connected' : 'Not configured'}
        </span>
      </div>
      <div className="space-y-2">
        <Label
          className="text-sm font-semibold text-[#e9f3ef]"
          htmlFor={keyFieldId}
        >
          {providerName} API key
        </Label>
        <Input
          autoComplete="new-password"
          className="border-white/15 bg-black/15 font-mono text-white shadow-none placeholder:text-[#719184] focus-visible:ring-offset-[#0a1d19]"
          id={keyFieldId}
          name="apiKey"
          placeholder={
            credential ? 'Enter a replacement key' : 'Paste an API key'
          }
          required
          type="password"
        />
        <p className="text-sm leading-6 text-[#a8c0b6]">
          It is encrypted before storage and never displayed again.
        </p>
      </div>
      <div className="space-y-2">
        <Label
          className="text-sm font-semibold text-[#e9f3ef]"
          htmlFor={modelFieldId}
        >
          {providerName} model
        </Label>
        <Input
          className="border-white/15 bg-black/15 text-white shadow-none placeholder:text-[#719184] focus-visible:ring-offset-[#0a1d19]"
          defaultValue={credential?.model}
          id={modelFieldId}
          name="model"
          placeholder={modelPlaceholders[provider]}
          required
        />
      </div>
      <p
        aria-atomic="true"
        aria-live={state.status === 'error' ? 'assertive' : 'polite'}
        className={
          state.status === 'error'
            ? 'min-h-6 text-sm text-[#ffd7dd]'
            : 'min-h-6 text-sm text-[#b9c9c4]'
        }
        role={state.status === 'error' ? 'alert' : 'status'}
      >
        {isPending ? 'Saving provider settings...' : state.message}
      </p>
      <Button
        className="min-h-12 rounded-2xl px-5 text-sm font-bold shadow-[0_18px_50px_rgb(31_194_142_/_26%)] hover:-translate-y-0.5 hover:brightness-110"
        disabled={isPending}
        type="submit"
      >
        {credential ? 'Replace saved key' : 'Save provider key'}
      </Button>
    </form>
  );
}
