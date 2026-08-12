import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@candorlens/ui';

const principles = [
  {
    description: 'Practice and interview conversations stay grounded in context, not automated conclusions.',
    title: 'Clear context',
  },
  {
    description: 'Each participant makes an informed choice before a session is captured or reviewed.',
    title: 'Explicit consent',
  },
  {
    description: 'Observations, inferences, and uncertainty remain visible for human judgment.',
    title: 'Human review',
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)] lg:items-end lg:gap-16 lg:px-8">
        <div className="max-w-3xl">
          <Badge className="mb-6" tone="muted">
            CandorLens
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-[-0.045em] text-[var(--cl-color-deep-forest)] sm:text-5xl lg:text-6xl">
            See the conversation clearly.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--cl-color-muted-foreground)] sm:text-lg sm:leading-8">
            A consent-first interview workspace for clearer practice, structured conversations, and evidence-oriented review.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--cl-radius-control)] bg-[var(--cl-color-primary)] px-4 py-2 text-sm font-semibold text-[var(--cl-color-primary-foreground)] shadow-[var(--cl-shadow-control)] transition-[background-color,box-shadow,transform] duration-[var(--cl-duration-fast)] ease-out hover:bg-[var(--cl-color-primary-hover)] motion-safe:active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2"
              href="/sign-in"
            >
              Sign in
            </a>
            <span className="text-sm leading-6 text-[var(--cl-color-muted-foreground)]">
              Consent is confirmed by people, not assumed by software.
            </span>
          </div>
        </div>

        <Card className="border-[var(--cl-color-border)] bg-[var(--cl-color-surface)]">
          <CardHeader>
            <CardTitle>Built for considered conversations</CardTitle>
            <CardDescription>
              CandorLens helps participants prepare, ask better follow-ups, and review what happened with care.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 border-t border-[var(--cl-color-border)] pt-5 text-sm leading-6">
              <div>
                <dt className="font-semibold text-[var(--cl-color-foreground)]">What was asked</dt>
                <dd className="text-[var(--cl-color-muted-foreground)]">A shared record of the conversation.</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--cl-color-foreground)]">What supports an answer</dt>
                <dd className="text-[var(--cl-color-muted-foreground)]">Evidence stays connected to the relevant context.</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--cl-color-foreground)]">What deserves follow-up</dt>
                <dd className="text-[var(--cl-color-muted-foreground)]">People decide the next useful question.</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="border-y border-[var(--cl-color-border)] bg-[var(--cl-color-muted)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="max-w-xl text-2xl font-bold tracking-[-0.03em] text-[var(--cl-color-deep-forest)] sm:text-3xl">
            Clarity that leaves room for judgment.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <Card key={principle.title}>
                <CardHeader>
                  <CardTitle>{principle.title}</CardTitle>
                  <CardDescription>{principle.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
