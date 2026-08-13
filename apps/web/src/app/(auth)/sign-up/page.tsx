import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

import { AuthForm } from '../../../components/auth/auth-form';
import { PublicShell } from '../../../components/public/public-shell';
import { signUp } from '../sign-in/actions';

export const metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <PublicShell actionHref="/sign-in" actionLabel="Sign in">
      <main className="relative flex flex-1 items-center overflow-hidden bg-[#080808] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgb(16_163_127_/_22%),transparent_32%),radial-gradient(circle_at_88%_76%,rgb(56_130_215_/_12%),transparent_30%)]"
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.72fr)] lg:items-center lg:gap-20">
          <section className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#82e7bd]">
              Start with clarity
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl lg:leading-[1.02]">
              Build a calmer, more accountable interview room.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#b9c9c4] sm:text-lg sm:leading-8">
              Create a private workspace for visible capture, connected context,
              and guidance that remains open to human review.
            </p>
          </section>

          <Card className="relative w-full overflow-hidden border-white/10 bg-[#101815]/95 text-white shadow-[0_32px_100px_rgb(0_0_0_/_38%)] backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#76e8bd] to-transparent"
            />
            <CardHeader className="p-7 pb-0 sm:p-8 sm:pb-0">
              <CardTitle className="text-3xl tracking-[-0.05em]">
                Create your CandorLens account
              </CardTitle>
              <CardDescription className="text-base leading-7 text-[#b7c7c1]">
                Start a consent-first interview workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-7 sm:p-8">
              <AuthForm action={signUp} mode="sign-up" />
            </CardContent>
          </Card>
        </div>
      </main>
    </PublicShell>
  );
}
