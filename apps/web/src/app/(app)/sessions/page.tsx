import Link from 'next/link';

import { SessionList } from '../../../components/sessions/session-list';
import {
  listSessionsForOwner,
  type SessionDatabaseClient,
} from '../../../data/sessions/repository';
import { requireUser } from '../../../lib/auth/require-user-server';
import { createClient } from '../../../lib/supabase/server';

export const metadata = { title: 'Sessions' };

export default async function SessionsPage() {
  const claims = await requireUser();
  const database = (await createClient()) as unknown as SessionDatabaseClient;
  const sessions = await listSessionsForOwner(database, claims);

  return (
    <section className="py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--cl-color-primary)]">
            Session workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[var(--cl-color-deep-forest)] sm:text-4xl">
            Your sessions
          </h1>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--cl-radius-control)] bg-[var(--cl-color-primary)] px-4 py-2 text-sm font-semibold text-[var(--cl-color-primary-foreground)] shadow-[var(--cl-shadow-control)] transition-colors hover:bg-[var(--cl-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
          href="/sessions/new"
        >
          Create session
        </Link>
      </div>
      <div className="mt-8 max-w-3xl">
        <SessionList sessions={sessions} />
      </div>
    </section>
  );
}
