'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

export default function ErrorPage({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-var(--cl-nav-height))] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>We could not load this workspace view.</CardTitle>
          <CardDescription>
            Nothing has been captured or changed. You can try loading this view
            again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
            If the problem continues, return home and try again later.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>Try again</Button>
          <a
            className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--cl-color-primary)] transition-colors duration-[var(--cl-duration-fast)] hover:text-[var(--cl-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
            href="/"
          >
            Return home
          </a>
        </CardFooter>
      </Card>
    </main>
  );
}
