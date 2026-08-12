import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

const principles = [
  {
    description:
      'Keep prompts, notes, and the conversation connected without adding noise.',
    index: '01',
    title: 'Clear context',
  },
  {
    description:
      'Make the decision to capture a conversation explicit, visible, and reversible.',
    index: '02',
    title: 'Explicit consent',
  },
  {
    description:
      'Keep observations and uncertainty available for people to assess together.',
    index: '03',
    title: 'Human review',
  },
];

export default function HomePage() {
  return (
    <main className="relative isolate overflow-hidden bg-[#080808] text-[#f7f7f5]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_-8%,rgb(16_163_127_/_21%),transparent_32%),radial-gradient(circle_at_93%_22%,rgb(81_150_255_/_11%),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgb(255_255_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.035)_1px,transparent_1px)] [background-size:56px_56px]"
      />

      <section className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,1.18fr)_minmax(23rem,0.82fr)] lg:items-end lg:gap-20 lg:px-8">
        <div className="max-w-3xl">
          <Badge
            className="mb-7 border border-white/10 bg-white/[0.06] px-3 py-2 text-[#d8e7e1]"
            tone="muted"
          >
            CandorLens
          </Badge>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl lg:leading-[0.96]">
            See the conversation. Keep the judgment human.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[#b7b7b1] sm:text-lg sm:leading-8">
            A consent-first interview workspace for clearer practice, structured
            conversations, and evidence-oriented review.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--cl-radius-control)] bg-[#10a37f] px-5 py-3 text-base font-semibold text-white shadow-[0_12px_34px_rgb(16_163_127_/_24%)] transition-[background-color,box-shadow,transform] duration-[var(--cl-duration-fast)] ease-out hover:-translate-y-0.5 hover:bg-[#16b58d] hover:shadow-[0_18px_42px_rgb(16_163_127_/_32%)] motion-safe:active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5ee8bd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
              href="/sign-in"
            >
              Sign in
            </a>
            <span className="text-sm leading-6 text-[#a9a9a2]">
              Consent is confirmed by people, not assumed by software.
            </span>
          </div>
        </div>

        <Card className="relative overflow-hidden border-white/10 bg-[#111111]/85 text-white shadow-[0_28px_80px_rgb(0_0_0_/_28%)] backdrop-blur-sm">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#74edbd]/70 to-transparent"
          />
          <CardHeader className="p-7 pb-0 sm:p-8 sm:pb-0">
            <p className="text-sm font-medium tracking-[0.02em] text-[#9dafa9]">
              INTERVIEW WORKSPACE
            </p>
            <CardTitle className="mt-4 text-3xl tracking-[-0.05em]">
              Built for considered conversations.
            </CardTitle>
          </CardHeader>
          <CardContent className="p-7 pt-6 sm:p-8 sm:pt-6">
            <dl className="space-y-5 border-t border-white/10 pt-6 text-base leading-7">
              <div className="grid grid-cols-[2rem_1fr] gap-3">
                <dt className="font-mono text-sm text-[#70e8b8]">01</dt>
                <dd>
                  <span className="font-semibold text-white">
                    What was asked
                  </span>
                  <span className="mt-1 block text-[#b7b7b1]">
                    A shared record of the conversation.
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-[2rem_1fr] gap-3">
                <dt className="font-mono text-sm text-[#70e8b8]">02</dt>
                <dd>
                  <span className="font-semibold text-white">
                    What supports an answer
                  </span>
                  <span className="mt-1 block text-[#b7b7b1]">
                    Evidence stays close to relevant context.
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-[2rem_1fr] gap-3">
                <dt className="font-mono text-sm text-[#70e8b8]">03</dt>
                <dd>
                  <span className="font-semibold text-white">
                    What deserves follow-up
                  </span>
                  <span className="mt-1 block text-[#b7b7b1]">
                    People decide the next useful question.
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <section className="relative border-y border-white/10 bg-[#101010]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-[0.02em] text-[#9dafa9]">
              PRINCIPLES
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Clarity that leaves room for judgment.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <Card
                className="border-white/10 bg-white/[0.035] text-white transition-[background-color,transform] duration-[var(--cl-duration-normal)] hover:-translate-y-0.5 hover:bg-white/[0.065]"
                key={principle.title}
              >
                <CardHeader className="p-6 sm:p-7">
                  <p className="font-mono text-sm text-[#70e8b8]">
                    {principle.index}
                  </p>
                  <CardTitle className="mt-10 text-xl">
                    {principle.title}
                  </CardTitle>
                  <p className="mt-3 text-base leading-7 text-[#b7b7b1]">
                    {principle.description}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
