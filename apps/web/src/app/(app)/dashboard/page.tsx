import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@candorlens/ui';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <section className="py-8 sm:py-12">
      <Badge tone="muted">Dashboard preview</Badge>
      <h1 className="mt-5 text-3xl font-bold tracking-[-0.035em] text-[var(--cl-color-deep-forest)] sm:text-4xl">
        Your interview workspace will appear here.
      </h1>
      <Card className="mt-8 max-w-2xl">
        <CardHeader>
          <CardTitle>No sessions to show yet</CardTitle>
          <CardDescription>
            This is a foundation placeholder. Workspace data, session capture, and review flows are intentionally not available until their dedicated tasks are complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
            CandorLens will keep consent, context, and human review visible at every step.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
