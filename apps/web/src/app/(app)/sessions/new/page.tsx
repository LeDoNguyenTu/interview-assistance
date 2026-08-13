import { SessionForm } from '../../../../components/sessions/session-form';
import {
  SessionBackLink,
  SessionPageFrame,
} from '../../../../components/sessions/session-page-frame';
import { getProviderAvailability } from '../../../../config/providers';
import {
  asProviderCredentialSql,
  listProviderCredentialSummaries,
} from '../../../../data/provider-credentials/repository';
import { requireUser } from '../../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../../lib/neon/database';
import { createSession } from './actions';

export const metadata = { title: 'Create session' };

export default async function NewSessionPage() {
  const claims = await requireUser();
  const credentials = await listProviderCredentialSummaries(
    asProviderCredentialSql(getNeonSql()),
    claims,
  );
  const providers = getProviderAvailability(
    process.env,
    credentials.map((credential) => credential.provider),
  );
  return (
    <SessionPageFrame>
      <div className="pointer-events-none absolute -right-24 top-8 -z-10 size-80 rounded-full bg-[#2f89d8]/10 blur-3xl" />
      <div>
        <div className="flex items-center justify-between gap-4">
          <SessionBackLink />
          <span className="hidden rounded-full border border-emerald-200/15 bg-emerald-300/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#a7e5c8] sm:inline-flex">
            Setup only
          </span>
        </div>
        <div className="mt-5 grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_28px_100px_rgb(0_0_0_/_0.22%)] sm:p-8">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
              New live workspace
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
              Set up the room first.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#b9c9c4]">
              This step prepares the workspace. It does not request browser
              permissions, start capture, or record consent.
            </p>
            <div className="mt-8 border-t border-white/10 pt-7">
              <SessionForm action={createSession} providers={providers} />
            </div>
          </div>
          <aside className="flex h-full flex-col rounded-[1.5rem] border border-emerald-200/15 bg-gradient-to-b from-[#123d33] to-[#0a211c] p-6 shadow-[0_24px_80px_rgb(0_0_0_/_18%)]">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#a4e5c6]">
              The sequence
            </p>
            <ol className="mt-6 space-y-5">
              {[
                ['01', 'Create the workspace'],
                ['02', 'Select visible sources'],
                ['03', 'Confirm consent'],
              ].map(([step, label]) => (
                <li className="flex items-center gap-3" key={step}>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-mono text-xs text-[#b7ead2]">
                    {step}
                  </span>
                  <span className="text-sm font-medium leading-5 text-white">
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-auto border-t border-white/10 pt-5 text-sm leading-6 text-[#b9d8cc]">
              You stay in control. A persistent status and immediate stop
              control remain visible during capture.
            </p>
          </aside>
        </div>
      </div>
    </SessionPageFrame>
  );
}
