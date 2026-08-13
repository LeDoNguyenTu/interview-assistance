import Link from 'next/link';

import { SessionForm } from '../../../../components/sessions/session-form';
import { getProviderAvailability } from '../../../../config/providers';
import { createSession } from './actions';

export const metadata = { title: 'Create session' };

export default function NewSessionPage() {
  const providers = getProviderAvailability(process.env);
  return (
    <section className="relative isolate py-4 sm:py-6">
      <div className="pointer-events-none absolute -right-24 top-8 -z-10 size-80 rounded-full bg-[#2f89d8]/10 blur-3xl" />
      <Link
        className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#a9d9c3] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-background)]"
        href="/sessions"
      >
        <span aria-hidden="true">←</span>&nbsp; Back to sessions
      </Link>
      <div className="mt-5 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/90 p-6 shadow-[0_28px_100px_rgb(0_0_0_/_0.22%)] sm:p-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
            New live workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
            Set up the room first.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#b9c9c4]">
            A draft prepares the workspace. It does not request browser
            permissions, start capture, or record consent.
          </p>
          <div className="mt-8 border-t border-white/10 pt-7">
            <SessionForm action={createSession} providers={providers} />
          </div>
        </div>
        <aside className="rounded-[1.5rem] border border-emerald-200/15 bg-gradient-to-b from-[#123d33] to-[#0a211c] p-6 shadow-[0_24px_80px_rgb(0_0_0_/_18%)]">
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
          <p className="mt-7 border-t border-white/10 pt-5 text-sm leading-6 text-[#b9d8cc]">
            You stay in control. A persistent status and immediate stop control
            remain visible during capture.
          </p>
        </aside>
      </div>
    </section>
  );
}
