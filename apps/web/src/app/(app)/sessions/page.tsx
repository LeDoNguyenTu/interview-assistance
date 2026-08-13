import Link from 'next/link';

import { SessionList } from '../../../components/sessions/session-list';
import {
  asSessionSql,
  listSessionsForOwner,
} from '../../../data/sessions/repository';
import { requireUser } from '../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../lib/neon/database';

export const metadata = { title: 'Sessions' };
export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const claims = await requireUser();
  const sessions = await listSessionsForOwner(
    asSessionSql(getNeonSql()),
    claims,
  );

  return (
    <section className="relative isolate py-4 sm:py-6">
      <div className="pointer-events-none absolute -top-24 right-0 -z-10 size-72 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-7 sm:pb-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
            Session archive
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
            Your sessions
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#b9c9c4]">
            Return to a prepared workspace or start a fresh, consented session.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#32bf90] via-[#149c75] to-[#0e7058] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_50px_rgb(31_194_142_/_26%)] transition-[box-shadow,transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_22px_60px_rgb(31_194_142_/_35%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf0cb] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-background)]"
          href="/sessions/new"
        >
          Create session <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mt-8 max-w-4xl">
        <SessionList sessions={sessions} />
      </div>
    </section>
  );
}
