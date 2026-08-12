import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  asSessionSql,
  getSessionForOwner,
} from '../../../../data/sessions/repository';
import { requireUser } from '../../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../../lib/neon/database';
import { SessionWorkspace } from '../../../../components/workspace/session-workspace';

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
    <section className="py-8 sm:py-12">
      <Link
        className="text-sm font-semibold text-[var(--cl-color-primary)] hover:text-[var(--cl-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
        href="/sessions"
      >
        Back to sessions
      </Link>
      <div className="mt-6 space-y-6">
        <div>
          <Badge tone="muted">{session.status}</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-[var(--cl-color-deep-forest)]">
            {session.title}
          </h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Session details</CardTitle>
            <CardDescription>
              Draft details stay private to your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Status</dt>
                <dd className="mt-1 text-[var(--cl-color-muted-foreground)]">
                  {session.status}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Consent</dt>
                <dd className="mt-1 text-[var(--cl-color-muted-foreground)]">
                  {session.consentedAt ? 'Recorded' : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Provider</dt>
                <dd className="mt-1 text-[var(--cl-color-muted-foreground)]">
                  {session.providerId}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Mode</dt>
                <dd className="mt-1 text-[var(--cl-color-muted-foreground)]">
                  {session.mode}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <SessionWorkspace session={session} />
      </div>
    </section>
  );
}
