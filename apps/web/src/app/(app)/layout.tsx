import type { ReactNode } from 'react';

import { AppChrome } from '../../components/app/app-chrome';
import { requireUser } from '../../lib/auth/require-user-server';

export const dynamic = 'force-dynamic';

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireUser();
  return <AppChrome>{children}</AppChrome>;
}
