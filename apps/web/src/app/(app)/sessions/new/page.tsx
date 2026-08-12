import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';
import Link from 'next/link';

import { SessionForm } from '../../../../components/sessions/session-form';
import { createSession } from './actions';

export const metadata = { title: 'Create session' };

export default function NewSessionPage() {
  return (
    <section className="py-8 sm:py-12">
      <Link
        className="text-sm font-semibold text-[var(--cl-color-primary)] hover:text-[var(--cl-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
        href="/sessions"
      >
        Back to sessions
      </Link>
      <Card className="mt-6 max-w-xl">
        <CardHeader>
          <CardTitle>Create a draft session</CardTitle>
          <CardDescription>
            This creates preparation details only. It does not begin capture or
            record consent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm action={createSession} />
        </CardContent>
      </Card>
    </section>
  );
}
