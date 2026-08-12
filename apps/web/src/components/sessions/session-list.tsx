import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';
import type { SessionRecord } from '@candorlens/core';
import Link from 'next/link';

export function SessionList({
  sessions,
}: Readonly<{ sessions: SessionRecord[] }>) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No sessions yet</CardTitle>
          <CardDescription>
            Create a draft to prepare the details of a future session.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <ul className="space-y-4">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link href={`/sessions/${session.id}`}>
            <Card className="transition-colors hover:bg-[var(--cl-color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle>{session.title}</CardTitle>
                  <Badge tone="muted">{session.status}</Badge>
                </div>
                <CardDescription>
                  {session.mode} mode - created{' '}
                  {new Intl.DateTimeFormat('en', {
                    dateStyle: 'medium',
                  }).format(new Date(session.createdAt))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--cl-color-muted-foreground)]">
                  Provider: {session.providerId}
                </p>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
