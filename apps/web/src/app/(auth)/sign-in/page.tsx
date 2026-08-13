import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

import { AuthForm } from '../../../components/auth/auth-form';
import { PublicShell } from '../../../components/public/public-shell';
import { signIn } from './actions';
import { SignInErrorAlert } from './sign-in-error-alert';

export const metadata = {
  title: 'Sign in',
};

export default async function SignInPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const { error } = await searchParams;

  return (
    <PublicShell actionHref="/sign-up" actionLabel="Create account">
      <main className="relative flex flex-1 items-center overflow-hidden bg-[#080808] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_5%,rgb(16_163_127_/_22%),transparent_31%),radial-gradient(circle_at_90%_72%,rgb(56_130_215_/_13%),transparent_30%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgb(255_255_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.035)_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.72fr)] lg:items-center lg:gap-20">
          <section className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#82e7bd]">
              Private workspace access
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl lg:leading-[1.02]">
              Your interview workspace, ready when you are.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#b9c9c4] sm:text-lg sm:leading-8">
              Return to live session context, saved transcripts, and provider
              controls from one focused workspace.
            </p>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Visible consent'],
                ['02', 'Private keys'],
                ['03', 'Human review'],
              ].map(([step, label]) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05%)]"
                  key={step}
                >
                  <p className="font-mono text-xs text-[#75dfb4]">{step}</p>
                  <p className="mt-5 text-sm font-semibold text-white">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Card className="relative w-full overflow-hidden border-white/10 bg-[#101815]/95 text-white shadow-[0_32px_100px_rgb(0_0_0_/_38%)] backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#76e8bd] to-transparent"
            />
            <CardHeader className="p-7 pb-0 sm:p-8 sm:pb-0">
              <CardTitle className="text-3xl tracking-[-0.05em]">
                Sign in to CandorLens
              </CardTitle>
              <CardDescription className="text-base leading-7 text-[#b7c7c1]">
                Continue securely to your consent-first interview workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-7 sm:p-8">
              <SignInErrorAlert error={error} />
              <AuthForm action={signIn} mode="sign-in" />
            </CardContent>
          </Card>
        </div>
      </main>
    </PublicShell>
  );
}
