import type { ReactNode } from 'react';

export default function ApplicationLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>;
}
