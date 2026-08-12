import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CandorLens',
    template: '%s | CandorLens',
  },
  description:
    'A consent-first interview workspace for clearer practice, structured conversations, and evidence-oriented review.',
};

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[var(--cl-color-background)] text-[var(--cl-color-foreground)] antialiased">
        <header className="border-b border-white/10 bg-[#080808]/95 backdrop-blur-sm">
          <div className="mx-auto flex h-[var(--cl-nav-height)] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <a
              className="inline-flex rounded-[var(--cl-radius-control)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
              href="/"
            >
              <Image
                alt="CandorLens"
                className="brightness-0 invert"
                height={37}
                priority
                src="/assets/brand/logo-horizontal.svg"
                width={181}
              />
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
