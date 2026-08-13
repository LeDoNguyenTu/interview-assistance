import { Badge } from '@candorlens/ui';

export const metadata = { title: 'Workspace settings' };

const guardrails = [
  {
    detail:
      'The browser opens its own source picker after you select sources and acknowledge consent.',
    title: 'Visible capture only',
  },
  {
    detail:
      'Every active session keeps a persistent status and a stop action in the workspace.',
    title: 'Immediate stop control',
  },
  {
    detail:
      'Provider credentials remain server-side. This interface does not expose secret values.',
    title: 'Server-side provider configuration',
  },
] as const;

export default function SettingsPage() {
  return (
    <section className="relative isolate py-4 sm:py-6">
      <div className="pointer-events-none absolute -left-20 top-0 -z-10 size-80 rounded-full bg-[#2f89d8]/10 blur-3xl" />
      <div className="max-w-3xl border-b border-white/10 pb-7 sm:pb-8">
        <Badge
          className="border border-white/10 bg-white/[0.055] px-3 text-[#d8e7e1]"
          tone="muted"
        >
          Workspace controls
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
          Workspace settings
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#b9c9c4]">
          The core safeguards for a consent-first live workspace are fixed in
          the product experience, not hidden behind a toggle.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {guardrails.map((guardrail, index) => (
          <article
            className="group min-h-64 rounded-[1.5rem] border border-white/10 bg-[#0a1d19]/85 p-6 shadow-[0_18px_60px_rgb(0_0_0_/_0.12%)] transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200/20 hover:bg-[#0d2922]"
            key={guardrail.title}
          >
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] font-mono text-xs font-medium text-[#a7e5c8]">
              0{index + 1}
            </span>
            <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em] text-white">
              {guardrail.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#b9c9c4]">
              {guardrail.detail}
            </p>
          </article>
        ))}
      </div>

      <aside className="mt-6 max-w-3xl rounded-[1.5rem] border border-emerald-200/15 bg-gradient-to-r from-[#123d33] to-[#0a211c] p-6 sm:p-7">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#a4e5c6]">
          Provider availability
        </p>
        <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
          Providers appear during session setup only when their server-side
          configuration is complete.
        </p>
      </aside>
    </section>
  );
}
