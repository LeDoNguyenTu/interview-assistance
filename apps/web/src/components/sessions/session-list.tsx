import { Badge } from '@candorlens/ui';
import type { SessionRecord } from '@candorlens/core';
import Link from 'next/link';

export function SessionList({
  sessions,
}: Readonly<{ sessions: SessionRecord[] }>) {
  if (sessions.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-[#0a1d19]/75 p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-16 size-48 rounded-full bg-emerald-300/10 blur-3xl"
        />
        <div className="relative max-w-md">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-emerald-200/15 bg-emerald-300/10 text-lg text-[#8cefc0]">
            01
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.045em] text-white">
            No sessions yet
          </h2>
          <p className="mt-3 text-base leading-7 text-[#b9c9c4]">
            Create a draft to prepare the details of a future session. Capture
            never starts until you select sources and confirm consent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            className="group relative block overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#0a1d19]/85 p-5 shadow-[0_16px_50px_rgb(0_0_0_/_0.12%)] transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-emerald-200/25 hover:bg-[#0d2922] hover:shadow-[0_20px_60px_rgb(0_0_0_/_0.24%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-background)] sm:p-6"
            href={`/sessions/${session.id}`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-emerald-200/70 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#86dcb6]">
                  {session.mode} session
                </p>
                <h2 className="mt-2 truncate text-xl font-semibold tracking-[-0.035em] text-white sm:text-2xl">
                  {session.title}
                </h2>
              </div>
              <Badge
                className="border border-white/10 bg-white/[0.055] px-3 text-[#d8e7e1]"
                tone="muted"
              >
                <span className="size-1.5 rounded-full bg-[#80e8b7]" />
                {session.status}
              </Badge>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] pt-4 text-sm text-[#a8c0b6]">
              <span>
                {new Intl.DateTimeFormat('en', {
                  dateStyle: 'medium',
                }).format(new Date(session.createdAt))}
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-1 rounded-full bg-[#5e9de0]"
                />
                {session.providerId === 'fixture'
                  ? 'Fixture preview'
                  : session.providerId}
              </span>
              <span className="ml-auto font-medium text-[#9df0cb] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white">
                Open session <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
