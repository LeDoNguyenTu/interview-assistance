import Link from 'next/link';
import type { ReactNode } from 'react';

export function SessionPageFrame({
  children,
  className = '',
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <section
      className={`relative isolate mx-auto w-full max-w-6xl ${className}`.trim()}
      data-testid="session-page-frame"
    >
      {children}
    </section>
  );
}

export function SessionBackLink() {
  return (
    <Link
      className="inline-flex min-h-12 shrink-0 cursor-pointer items-center rounded-xl border border-white/20 bg-[#102823]/95 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08%),0_10px_28px_rgb(0_0_0_/_0.18%)] transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200/40 hover:bg-[#15372f] hover:shadow-[0_14px_34px_rgb(0_0_0_/_0.25%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-background)]"
      href="/sessions"
    >
      <svg
        aria-hidden="true"
        className="mr-2 size-4"
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          d="m12.5 15-5-5 5-5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
      Back to sessions
    </Link>
  );
}
