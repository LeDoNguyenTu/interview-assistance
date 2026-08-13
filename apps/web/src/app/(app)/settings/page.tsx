import { Badge } from '@candorlens/ui';

import { AccountSecurityPanel } from '../../../components/settings/account-security-panel';
import { ProviderSettingsForm } from '../../../components/settings/provider-settings-form';
import {
  asProviderCredentialSql,
  listProviderCredentialSummaries,
} from '../../../data/provider-credentials/repository';
import { requireUser } from '../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../lib/neon/database';

import { saveProviderSettings, signOut } from './actions';

export const metadata = { title: 'Account and workspace settings' };
export const dynamic = 'force-dynamic';

const guardrails = [
  {
    detail:
      'The browser opens its source picker only after consent is confirmed.',
    title: 'Visible capture only',
  },
  {
    detail:
      'Every active session keeps a persistent status and an immediate stop control.',
    title: 'Immediate stop control',
  },
  {
    detail:
      'Your key is encrypted before storage and is never rendered back into the workspace.',
    title: 'Account-owned credentials',
  },
] as const;

const providerDetails = [
  {
    description:
      'Connect a personal OpenAI key and choose the text model used for live session guidance.',
    provider: 'openai' as const,
    step: '01',
    title: 'OpenAI',
  },
  {
    description:
      'Connect a personal Gemini key and choose the model used for live session guidance.',
    provider: 'gemini' as const,
    step: '02',
    title: 'Gemini',
  },
] as const;

export default async function SettingsPage() {
  const claims = await requireUser();
  const credentials = await listProviderCredentialSummaries(
    asProviderCredentialSql(getNeonSql()),
    claims,
  );

  return (
    <section className="relative isolate py-4 sm:py-6">
      <div className="pointer-events-none absolute -left-20 top-0 -z-10 size-80 rounded-full bg-[#2f89d8]/10 blur-3xl" />
      <div className="max-w-3xl border-b border-white/10 pb-7 sm:pb-8">
        <Badge
          className="border border-white/10 bg-white/[0.055] px-3 text-[#d8e7e1]"
          tone="muted"
        >
          Account controls
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
          Account and workspace settings
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#b9c9c4]">
          Manage sign-in security and provider connections from one organized
          control center.
        </p>
      </div>

      <section aria-labelledby="account-security-title" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
              Personal access
            </p>
            <h2
              className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl"
              id="account-security-title"
            >
              Account security
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#b9d8cc]">
            Private to you
          </span>
        </div>
        <div className="mt-6">
          <AccountSecurityPanel
            email={claims.email ?? ''}
            signOutAction={signOut}
          />
        </div>
      </section>

      <section aria-labelledby="provider-keys-title" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
              Provider connections
            </p>
            <h2
              className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl"
              id="provider-keys-title"
            >
              Bring your own key.
            </h2>
          </div>
          <span className="rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#a7e5c8]">
            Encrypted at rest
          </span>
        </div>
        <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-2">
          {providerDetails.map((provider) => {
            const credential = credentials.find(
              (item) => item.provider === provider.provider,
            );

            return (
              <article
                aria-labelledby={`${provider.provider}-settings-title`}
                className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_24px_80px_rgb(0_0_0_/_18%)] sm:p-7"
                key={provider.provider}
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-16 -top-16 size-44 rounded-full bg-emerald-300/10 blur-3xl"
                />
                <div className="relative flex items-start gap-4 lg:min-h-36">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] font-mono text-xs font-medium text-[#a7e5c8]">
                    {provider.step}
                  </span>
                  <div>
                    <h3
                      className="text-xl font-semibold tracking-[-0.035em] text-white"
                      id={`${provider.provider}-settings-title`}
                    >
                      {provider.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#b9c9c4]">
                      {provider.description}
                    </p>
                  </div>
                </div>
                <ProviderSettingsForm
                  action={saveProviderSettings}
                  credential={credential ?? null}
                  provider={provider.provider}
                />
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="guardrails-title" className="mt-10">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
            Non-negotiable guardrails
          </p>
          <h2
            className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl"
            id="guardrails-title"
          >
            The safeguards stay visible.
          </h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {guardrails.map((guardrail, index) => (
            <article
              className="group min-h-56 rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/85 p-6 shadow-[0_18px_60px_rgb(0_0_0_/_0.12%)] transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200/20 hover:bg-[#0d2922]"
              key={guardrail.title}
            >
              <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] font-mono text-xs font-medium text-[#a7e5c8]">
                0{index + 1}
              </span>
              <h3 className="mt-7 text-lg font-semibold tracking-[-0.03em] text-white">
                {guardrail.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#b9c9c4]">
                {guardrail.detail}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
