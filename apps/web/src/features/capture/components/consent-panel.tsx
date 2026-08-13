'use client';

import { Button } from '@candorlens/ui';
import { useReducer } from 'react';

import type { BrowserCaptureCapabilities } from '../browser-capabilities';
import {
  createCaptureConsentState,
  reduceCaptureConsent,
  type CaptureSelection,
} from '../consent-machine';

import { SourcePicker } from './source-picker';

type ConsentPanelProps = {
  capabilities: BrowserCaptureCapabilities;
  onRequestCapture(selection: CaptureSelection): void | Promise<void>;
};

export function ConsentPanel({
  capabilities,
  onRequestCapture,
}: Readonly<ConsentPanelProps>) {
  const [state, dispatch] = useReducer(
    reduceCaptureConsent,
    undefined,
    createCaptureConsentState,
  );

  async function requestCapture() {
    dispatch({ type: 'request-permission' });
    try {
      await onRequestCapture(state.selection);
      dispatch({ type: 'permission-granted' });
    } catch {
      dispatch({ type: 'permission-denied' });
    }
  }

  if (state.status === 'explaining') {
    return (
      <section aria-labelledby="capture-consent-title" className="space-y-5">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
            Consent checkpoint
          </p>
          <h2
            className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white"
            id="capture-consent-title"
          >
            Confirm before your browser opens a source picker.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#b9c9c4]">
            CandorLens will request only the sources you selected. You are
            responsible for obtaining permission from every participant.
          </p>
        </div>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#dce8e3]">
          <input
            checked={state.consentAcknowledged}
            className="mt-1"
            onChange={() => dispatch({ type: 'acknowledge-consent' })}
            type="checkbox"
          />
          I confirm all participants have consented to the selected visible
          capture sources.
        </label>
        {state.error ? (
          <p
            className="text-sm text-[var(--cl-color-danger-foreground)]"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!state.consentAcknowledged}
            onClick={() => dispatch({ type: 'confirm' })}
            type="button"
          >
            Confirm and choose sources
          </Button>
          <Button
            onClick={() => dispatch({ type: 'cancel' })}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  if (state.status === 'confirmed' || state.status === 'requesting') {
    return (
      <section aria-labelledby="capture-request-title" className="space-y-5">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
            Sources confirmed
          </p>
          <h2
            className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white"
            id="capture-request-title"
          >
            Request browser permission when you are ready.
          </h2>
        </div>
        <Button
          disabled={state.status === 'requesting'}
          onClick={requestCapture}
          type="button"
        >
          {state.status === 'requesting'
            ? 'Requesting browser permission...'
            : 'Request browser permission'}
        </Button>
      </section>
    );
  }

  if (state.status === 'ready') {
    return (
      <p
        className="text-sm text-[var(--cl-color-status-success)]"
        role="status"
      >
        Browser sources are ready. Capture has not started yet.
      </p>
    );
  }

  if (state.status === 'failed' || state.status === 'cancelled') {
    return (
      <section className="space-y-4">
        {state.error ? <p role="alert">{state.error}</p> : null}
        <Button onClick={() => dispatch({ type: 'reset' })} type="button">
          Review sources again
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="capture-source-title" className="space-y-5">
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
          Live session setup
        </p>
        <h2
          className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white"
          id="capture-source-title"
        >
          Select audio sources.
        </h2>
      </div>
      <SourcePicker
        capabilities={capabilities}
        onChange={(selection) =>
          dispatch({ selection, type: 'select-sources' })
        }
        selection={state.selection}
      />
      {state.error ? (
        <p
          className="text-sm text-[var(--cl-color-danger-foreground)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <Button onClick={() => dispatch({ type: 'continue' })} type="button">
        Continue
      </Button>
    </section>
  );
}
