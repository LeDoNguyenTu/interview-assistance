import type { ReactNode } from 'react';

import { requireUser } from '../../lib/auth/require-user-server';

export const dynamic = 'force-dynamic';

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireUser();
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </main>
  );
}
