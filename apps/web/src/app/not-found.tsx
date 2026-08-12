import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-var(--cl-nav-height))] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>This workspace view is not available.</CardTitle>
          <CardDescription>
            The page may have moved, or it may require a workspace that has not
            been configured yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            className="text-sm font-semibold text-[var(--cl-color-primary)] transition-colors duration-[var(--cl-duration-fast)] hover:text-[var(--cl-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
            href="/"
          >
            Return home
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
