import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
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
    <html className={`${GeistSans.variable} ${GeistMono.variable}`} lang="en">
      <body className="min-h-dvh bg-[var(--cl-color-background)] text-[var(--cl-color-foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
