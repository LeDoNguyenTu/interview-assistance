'use client';

import { Button, Label } from '@candorlens/ui';
import Link from 'next/link';
import { useState } from 'react';

import type { ConfigurableProvider } from '../../../data/provider-credentials/input';
import {
  guidanceLabelForMode,
  normalizeGuidanceText,
} from '../../../lib/guidance/presentation';
import type { LiveTranscriptItem } from '../live-session-machine';

type GuidanceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { message: string; status: 'error' }
  | { provider: ConfigurableProvider; status: 'ready'; text: string };

type GuidanceCardProps = {
  fetchImpl: typeof fetch;
  mode: 'coach' | 'defense' | 'interviewer';
  notes: string[];
  providers: readonly ConfigurableProvider[];
  initialGuidance?: {
    provider: ConfigurableProvider;
    text: string;
  } | null;
  sessionId: string;
  title: string;
  transcript: LiveTranscriptItem[];
};

const providerNames: Record<ConfigurableProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
};

export function GuidanceCard({
  fetchImpl,
  initialGuidance = null,
  mode,
  notes,
  providers,
  sessionId,
  title,
  transcript,
}: Readonly<GuidanceCardProps>) {
  const [provider, setProvider] = useState<ConfigurableProvider | null>(
    providers[0] ?? null,
  );
  const [guidance, setGuidance] = useState<GuidanceState>(
    initialGuidance
      ? { ...initialGuidance, status: 'ready' }
      : { status: 'idle' },
  );
  const guidanceLabel = guidanceLabelForMode(mode);

  async function requestGuidance() {
    if (!provider || transcript.length === 0) return;

    setGuidance({ status: 'loading' });
    try {
      const response = await fetchImpl('/api/guidance', {
        body: JSON.stringify({
          mode,
          notes: notes.slice(-12),
          provider,
          sessionId,
          title,
          transcript: transcript.slice(-12).map((item) => ({
            speaker: item.speaker,
            text: item.text,
            timestamp: item.timestamp,
          })),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = (await response.json()) as {
        error?: unknown;
        provider?: unknown;
        text?: unknown;
      };
      if (
        !response.ok ||
        typeof payload.text !== 'string' ||
        (payload.provider !== 'openai' && payload.provider !== 'gemini')
      ) {
        setGuidance({
          message:
            typeof payload.error === 'string'
              ? payload.error
              : 'Unable to generate guidance.',
          status: 'error',
        });
        return;
      }

      setGuidance({
        provider: payload.provider,
        status: 'ready',
        text: payload.text,
      });
    } catch {
      setGuidance({
        message:
          'Unable to generate guidance. Check your connection and retry.',
        status: 'error',
      });
    }
  }

  return (
    <article className="relative overflow-hidden rounded-[1.5rem] border border-emerald-200/15 bg-gradient-to-b from-[#123d33] to-[#091d19] p-6 shadow-[0_24px_80px_rgb(0_0_0_/_18%)]">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 size-44 rounded-full bg-emerald-300/10 blur-3xl"
      />
      <div className="relative">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#9be8c5]">
          On-demand guidance
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
          Guidance
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#b9d8cc]">
          Nothing is sent until you request it. Review every suggestion before
          use.
        </p>

        {provider ? (
          <div className="mt-6 space-y-4">
            {providers.length > 1 ? (
              <div className="space-y-2">
                <Label className="text-[#e9f3ef]" htmlFor="guidance-provider">
                  Guidance provider
                </Label>
                <select
                  className="min-h-12 w-full cursor-pointer rounded-xl border border-white/15 bg-[#061612] px-3 text-base text-white outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#9bf0cb]"
                  id="guidance-provider"
                  onChange={(event) =>
                    setProvider(event.target.value as ConfigurableProvider)
                  }
                  value={provider}
                >
                  {providers.map((item) => (
                    <option key={item} value={item}>
                      {providerNames[item]}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#dceae4]">
                Using {providerNames[provider]}
              </p>
            )}
            <Button
              className="min-h-12 w-full cursor-pointer rounded-xl text-base"
              disabled={
                guidance.status === 'loading' || transcript.length === 0
              }
              onClick={requestGuidance}
              type="button"
            >
              {guidance.status === 'loading'
                ? 'Generating draft...'
                : 'Generate guidance'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-sm leading-6 text-[#dceae4]">
              Connect OpenAI or Gemini before requesting guidance.
            </p>
            <Link
              className="mt-3 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#9bf0cb] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf0cb]"
              href="/settings"
            >
              Open provider settings
            </Link>
          </div>
        )}

        {guidance.status === 'error' ? (
          <div
            className="mt-4 rounded-xl border border-rose-200/20 bg-rose-400/10 p-4 text-sm leading-6 text-[#ffd7dd]"
            role="alert"
          >
            {guidance.message}
          </div>
        ) : null}
        {guidance.status === 'ready' ? (
          <div
            aria-live="polite"
            className="mt-4 rounded-xl border border-emerald-200/15 bg-black/20 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#b8f4d5]">
                {guidanceLabel}
              </p>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[#c9ded5]">
                {providerNames[guidance.provider]}
              </span>
            </div>
            <p className="mt-4 text-[1.0625rem] leading-7 text-white">
              {normalizeGuidanceText(guidance.text)}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
