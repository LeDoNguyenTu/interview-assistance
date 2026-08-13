import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  asSessionSql,
  getSessionForOwner,
} from '../../../../data/sessions/repository';
import { requireUser } from '../../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../../lib/neon/database';
import { LiveSessionScreen } from '../../../../features/live-session/components/live-session-screen';

export const metadata = { title: 'Session details' };
export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({
  params,
}: Readonly<{ params: Promise<{ sessionId: string }> }>) {
  const claims = await requireUser();
  const { sessionId } = await params;
  const session = await getSessionForOwner(
    asSessionSql(getNeonSql()),
    claims,
    sessionId,
  );

  if (!session) {
    notFound();
  }

  return (
    <section className="space-y-6 py-2 sm:py-4">
      <Link
        className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#a9d9c3] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-background)]"
        href="/sessions"
      >
        Back to sessions
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
            Live session
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            {session.title}
          </h1>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#b9c9c4]">
          {session.status}
        </span>
      </div>
      <LiveSessionScreen session={session} />
    </section>
  );
}
