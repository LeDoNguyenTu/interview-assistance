import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';
import Link from 'next/link';

import { SessionList } from '../../../components/sessions/session-list';
import {
  listSessionsForOwner,
  type SessionDatabaseClient,
} from '../../../data/sessions/repository';
import { requireUser } from '../../../lib/auth/require-user-server';
import { createClient } from '../../../lib/supabase/server';

import { signOut } from './actions';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const claims = await requireUser();
  const database = (await createClient()) as unknown as SessionDatabaseClient;
  const sessions = await listSessionsForOwner(database, claims);

  return (
    <section className="space-y-8 py-4 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <Badge tone="muted">Session command center</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[var(--cl-color-deep-forest)] sm:text-5xl">
            Run a clearer interview.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--cl-color-muted-foreground)]">
            Create a transparent session, keep relevant context in one place,
            and review the conversation with care.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--cl-radius-control)] bg-[var(--cl-color-primary)] px-5 py-3 text-sm font-bold text-[var(--cl-color-primary-foreground)] shadow-[var(--cl-shadow-control)] transition-[background-color,transform] duration-[var(--cl-duration-normal)] hover:bg-[var(--cl-color-primary-hover)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
          href="/sessions/new"
        >
          New session
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-transform duration-[var(--cl-duration-normal)] motion-safe:hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Consent first</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
              Capture only begins after you confirm consent. Every workflow
              keeps that decision visible.
            </p>
          </CardContent>
        </Card>
        <Card className="transition-transform duration-[var(--cl-duration-normal)] motion-safe:hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Context ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
              Keep the session objective, prompts, and facilitator notes beside
              the conversation.
            </p>
          </CardContent>
        </Card>
        <Card className="transition-transform duration-[var(--cl-duration-normal)] motion-safe:hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Human review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
              Use evidence and notes to guide a fair review. CandorLens does not
              issue final decisions.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Recent sessions</CardTitle>
                <CardDescription>
                  Open a session to use the visible fixture workspace.
                </CardDescription>
              </div>
              <Link
                className="text-sm font-bold text-[var(--cl-color-primary)] hover:text-[var(--cl-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
                href="/sessions"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <SessionList sessions={sessions.slice(0, 3)} />
          </CardContent>
        </Card>
        <Card className="bg-[var(--cl-color-deep-forest)] text-[var(--cl-color-canvas)]">
          <CardHeader>
            <CardTitle>Fixture mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-[#c2d7d0]">
              This milestone demonstrates the full session flow with sample
              content only.
            </p>
            <Link
              className="inline-flex min-h-11 items-center font-bold text-[var(--cl-color-warm-mint)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-warm-mint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-deep-forest)]"
              href="/sessions/new"
            >
              Create a fixture session
            </Link>
            <form action={signOut}>
              <button
                className="text-sm font-bold text-[#c2d7d0] underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-warm-mint)]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
