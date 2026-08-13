import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type PublicShellProps = {
  actionHref: '/sign-in' | '/sign-up';
  actionLabel: 'Create account' | 'Sign in';
  children: ReactNode;
};

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/#principles', label: 'Principles' },
  { href: '/sign-up', label: 'Create account' },
] as const;

export function PublicShell({
  actionHref,
  actionLabel,
  children,
}: Readonly<PublicShellProps>) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-[#080808] text-[#f7f7f5]">
      <header className="relative z-30 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-24 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            aria-label="CandorLens home"
            className="inline-flex min-h-12 cursor-pointer items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78ecc0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
            href="/"
          >
            <Image
              alt="CandorLens"
              className="h-auto w-[10.75rem] brightness-0 invert sm:w-[14.5rem]"
              height={47}
              priority
              src="/assets/brand/logo-horizontal.svg"
              width={230}
            />
          </Link>
          <Link
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.07%)] transition-[background-color,border-color] duration-200 hover:border-white/25 hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78ecc0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        </div>
      </header>

      {children}

      <footer
        className="relative z-20 mt-auto border-t border-white/10 bg-[#070d0b]"
        role="contentinfo"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold text-white">
              &copy; 2026 CandorLens
            </p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#9fb8ae]">
              Consent-first capture, visible controls, and guidance that keeps
              human judgment in charge.
            </p>
          </div>
          <nav
            aria-label="Public shortcuts"
            className="flex flex-wrap items-center gap-1"
          >
            {footerLinks.map((link) => (
              <Link
                className="inline-flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm font-medium text-[#b9c9c4] transition-colors duration-200 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78ecc0]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
