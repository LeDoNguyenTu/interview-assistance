import { Badge, CardContent } from '@candorlens/ui';
import Link from 'next/link';
import type { SVGProps } from 'react';

import { SessionList } from '../../../components/sessions/session-list';
import {
  asSessionSql,
  listSessionsForOwner,
} from '../../../data/sessions/repository';
import { requireUser } from '../../../lib/auth/require-user-server';
import { getNeonSql } from '../../../lib/neon/database';

import { signOut } from './actions';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function ArrowUpRightIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}>
      <path
        d="M7 17L17 7M9 7H17V15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
    </svg>
  );
}

function SparkleIcon({ size = 28, ...props }: IconProps) {
  return (
    <svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...props}>
      <path
        d="M12 2L14.15 9.85L22 12L14.15 14.15L12 22L9.85 14.15L2 12L9.85 9.85L12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PillarIcon({ path, ...props }: IconProps & { path: string }) {
  return (
    <svg fill="none" height={24} viewBox="0 0 24 24" width={24} {...props}>
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SessionSignal() {
  return (
    <div
      aria-label="Session activity visualization"
      className="relative min-h-[21rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a2722] p-6 sm:p-8"
      role="img"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_14%,rgb(75_222_169_/_24%),transparent_33%),radial-gradient(circle_at_8%_100%,rgb(42_122_207_/_20%),transparent_38%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.02em] text-[#c9ddd6]">
            Conversation signal
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
            Clear, present, human.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#70e7b9]/25 bg-[#70e7b9]/10 px-3 py-2 text-sm font-semibold text-[#b5f6d5]">
          <span className="h-2 w-2 rounded-full bg-[#72edbd] shadow-[0_0_0_5px_rgb(114_237_189_/_12%)]" />
          Ready
        </span>
      </div>
      <svg
        aria-hidden="true"
        className="relative mt-10 h-36 w-full overflow-visible"
        fill="none"
        viewBox="0 0 640 150"
      >
        <defs>
          <linearGradient id="signal-line" x1="0" x2="640" y1="0" y2="0">
            <stop stopColor="#3bc895" />
            <stop offset="0.54" stopColor="#c8f6de" />
            <stop offset="1" stopColor="#4bb0ff" />
          </linearGradient>
          <linearGradient id="signal-fill" x1="0" x2="0" y1="0" y2="150">
            <stop stopColor="#62dca9" stopOpacity="0.34" />
            <stop offset="1" stopColor="#62dca9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 112C26 103 35 88 62 94C95 102 104 49 139 62C168 72 177 122 208 115C242 106 249 31 283 41C317 51 323 89 353 84C381 80 401 18 435 29C465 39 480 104 512 96C544 89 551 50 579 57C604 63 616 41 640 46V150H0Z"
          fill="url(#signal-fill)"
        />
        <path
          d="M0 112C26 103 35 88 62 94C95 102 104 49 139 62C168 72 177 122 208 115C242 106 249 31 283 41C317 51 323 89 353 84C381 80 401 18 435 29C465 39 480 104 512 96C544 89 551 50 579 57C604 63 616 41 640 46"
          stroke="url(#signal-line)"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <div className="relative grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-sm">
        <div>
          <p className="text-[#a6c3b9]">Consent</p>
          <p className="mt-1 font-semibold text-white">Visible</p>
        </div>
        <div>
          <p className="text-[#a6c3b9]">Context</p>
          <p className="mt-1 font-semibold text-white">Structured</p>
        </div>
        <div>
          <p className="text-[#a6c3b9]">Review</p>
          <p className="mt-1 font-semibold text-white">Human-led</p>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const claims = await requireUser();
  const sessions = await listSessionsForOwner(
    asSessionSql(getNeonSql()),
    claims,
  );

  return (
    <section className="relative isolate -mx-4 -my-8 overflow-hidden bg-[#071b18] px-4 py-10 text-[#f5f9f7] sm:-mx-6 sm:px-6 sm:py-14 lg:-mx-8 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -right-32 top-8 h-[30rem] w-[30rem] rounded-full bg-[#18b383]/20 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#2f89d8]/15 blur-3xl" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(255_255_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.035)_1px,transparent_1px)] [background-size:52px_52px]" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 sm:space-y-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(23rem,0.95fr)] lg:items-end">
          <div className="max-w-3xl">
            <Badge
              className="border border-white/10 bg-white/[0.08] px-3 py-2 text-[#d9eee6]"
              tone="muted"
            >
              Session command center
            </Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl lg:leading-[0.96]">
              Better interviews begin with a clearer room.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#c0d4cc] sm:text-lg sm:leading-8">
              Set up the conversation, keep the useful context close, and make
              every review easier to explain. Capture only begins after you
              confirm consent.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#32bf90] via-[#149c75] to-[#0e7058] px-5 py-3 text-base font-bold text-white shadow-[0_18px_50px_rgb(31_194_142_/_28%)] transition-[box-shadow,transform,filter] duration-[var(--cl-duration-normal)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_22px_60px_rgb(31_194_142_/_38%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf0cb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b18]"
                href="/sessions/new"
              >
                New session
                <ArrowUpRightIcon aria-hidden="true" size={19} />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-[var(--cl-duration-normal)] hover:-translate-y-0.5 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf0cb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b18]"
                href="/sessions"
              >
                Browse sessions
              </Link>
            </div>
          </div>
          <SessionSignal />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              iconPath:
                'M6.5 12.5L10.25 16L18 8.25M21 12A9 9 0 1 1 3 12A9 9 0 0 1 21 12Z',
              label: 'Consent',
              value: 'Always visible',
            },
            {
              iconPath: 'M6 4H16L20 8V20H6V4ZM16 4V8H20M9 13H17M9 17H14',
              label: 'Context',
              value: 'Ready when needed',
            },
            {
              iconPath:
                'M8 7A3 3 0 1 1 2 7A3 3 0 0 1 8 7ZM22 7A3 3 0 1 1 16 7A3 3 0 0 1 22 7ZM15 19A3 3 0 1 1 9 19A3 3 0 0 1 15 19ZM8 8.5L10.5 16M16 8.5L13.5 16',
              label: 'Review',
              value: 'Evidence-led',
            },
          ].map(({ iconPath, label, value }) => (
            <div
              className="group flex min-h-44 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] p-5 text-center shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06%)] transition-[background-color,transform] duration-[var(--cl-duration-normal)] hover:-translate-y-0.5 hover:bg-white/[0.085]"
              key={label}
            >
              <PillarIcon
                aria-hidden="true"
                className="text-[#79e5b5]"
                path={iconPath}
              />
              <p className="mt-5 text-sm font-semibold text-[#acc5bb]">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.035em] text-white">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-5 shadow-[0_24px_80px_rgb(0_0_0_/_16%)] backdrop-blur-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-sm font-semibold tracking-[0.02em] text-[#acc5bb]">
                  Your workspace
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                  Recent sessions
                </h2>
                <p className="mt-2 text-base leading-7 text-[#c0d4cc]">
                  Open a session to continue with the visible live workspace.
                </p>
              </div>
              <Link
                className="inline-flex items-center gap-2 text-base font-semibold text-[#9df0cb] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf0cb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e2a25]"
                href="/sessions"
              >
                View all
                <ArrowUpRightIcon aria-hidden="true" size={17} />
              </Link>
            </div>
            <div className="mt-6">
              <SessionList sessions={sessions.slice(0, 3)} />
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-[#5ee3ae]/20 bg-gradient-to-b from-[#164d40] to-[#0d2a25] p-6 shadow-[0_24px_80px_rgb(0_0_0_/_20%)]">
            <SparkleIcon
              aria-hidden="true"
              className="text-[#92f0c3]"
              size={28}
            />
            <p className="mt-8 text-sm font-semibold tracking-[0.02em] text-[#a9d7c2]">
              Live workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-white">
              Prepare the flow, transparently.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#c8e1d6]">
              Choose a configured provider or use the fixture preview to walk
              through the consented session flow.
            </p>
            <Link
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#149c75] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_34px_rgb(20_156_117_/_28%)] transition-[transform,box-shadow,background-color] duration-[var(--cl-duration-normal)] hover:-translate-y-0.5 hover:bg-[#1bb184] hover:shadow-[0_18px_42px_rgb(20_156_117_/_38%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5f9dc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#164d40]"
              href="/sessions/new"
            >
              Create a session
              <ArrowUpRightIcon aria-hidden="true" size={16} />
            </Link>
            <form action={signOut} className="mt-6">
              <button
                className="text-sm font-semibold text-[#b9d8cc] underline decoration-[#7ccaa9]/50 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf0cb]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </aside>
        </div>
      </div>
    </section>
  );
}
