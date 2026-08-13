import { notFound } from 'next/navigation';

import {
  asSessionSql,
  getSessionForOwner,
} from '../../../../data/sessions/repository';
import {
  asProviderCredentialSql,
  listProviderCredentialSummaries,
} from '../../../../data/provider-credentials/repository';
import { requireUser } from '../../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../../lib/neon/database';
import { LiveSessionScreen } from '../../../../features/live-session/components/live-session-screen';
import {
  asLiveSessionSql,
  listLiveSessionSnapshot,
} from '../../../../data/live-session/repository';
import {
  SessionBackLink,
  SessionPageFrame,
} from '../../../../components/sessions/session-page-frame';

export const metadata = { title: 'Session details' };
export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({
  params,
}: Readonly<{ params: Promise<{ sessionId: string }> }>) {
  const claims = await requireUser();
  const { sessionId } = await params;
  const sql = getNeonSql();
  const [session, credentials, snapshot] = await Promise.all([
    getSessionForOwner(asSessionSql(sql), claims, sessionId),
    listProviderCredentialSummaries(asProviderCredentialSql(sql), claims),
    listLiveSessionSnapshot(asLiveSessionSql(sql), claims, sessionId),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <SessionPageFrame className="space-y-6">
      <SessionBackLink />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#83dcb4]">
            Live session
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            {session.title}
          </h1>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#b9c9c4]">
          {session.status}
        </span>
      </div>
      <LiveSessionScreen
        guidanceProviders={credentials.map((credential) => credential.provider)}
        initialGuidance={snapshot.guidance}
        initialNotes={snapshot.notes}
        initialTranscript={snapshot.transcript}
        session={session}
      />
    </SessionPageFrame>
  );
}
