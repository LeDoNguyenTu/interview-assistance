'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppFooter } from './app-footer';

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/settings', label: 'Settings' },
] as const;

export function AppChrome({
  activePath,
  children,
}: Readonly<{ activePath?: string; children: ReactNode }>) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;

  return (
    <div className="cl-app-shell flex min-h-dvh flex-col overflow-x-clip bg-[var(--cl-color-background)] text-[var(--cl-color-foreground)]">
      <a
        className="sr-only fixed left-4 top-4 z-[100] min-h-11 rounded-xl bg-[var(--cl-color-primary)] px-4 py-2 text-sm font-semibold text-[var(--cl-color-primary-foreground)] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[var(--cl-color-ring)] focus:ring-offset-2 focus:ring-offset-[var(--cl-color-background)]"
        href="#app-content"
      >
        Skip to content
      </a>
      <div aria-hidden="true" className="cl-app-grid pointer-events-none" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061310]/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[4.75rem] max-w-[90rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            aria-label="CandorLens dashboard"
            className="inline-flex shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061310]"
            href="/dashboard"
          >
            <Image
              alt="CandorLens"
              className="h-auto w-[8.8rem] brightness-0 invert"
              height={30}
              priority
              src="/assets/brand/logo-horizontal.svg"
              width={177}
            />
          </Link>
          <nav
            aria-label="Workspace navigation"
            className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto py-2"
          >
            {navigation.map((item) => {
              const current =
                currentPath === item.href ||
                (item.href === '/sessions' &&
                  currentPath?.startsWith('/sessions/'));

              return (
                <Link
                  aria-current={current ? 'page' : undefined}
                  className={
                    current
                      ? 'inline-flex min-h-11 items-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06%)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061310]'
                      : 'inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-[#b9c9c4] transition-colors duration-200 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061310]'
                  }
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[#b9c9c4] lg:inline-flex">
            <span className="size-1.5 rounded-full bg-[#68e8ae] shadow-[0_0_0_4px_rgb(104_232_174_/_0.1)]" />
            Workspace ready
          </span>
        </div>
      </header>
      <main
        className="relative w-full flex-1 px-4 py-4 sm:px-6 lg:px-8"
        id="app-content"
      >
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
