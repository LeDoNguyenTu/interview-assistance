import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';
import Link from 'next/link';

import { EmailVerificationForm } from '../../../components/auth/email-verification-form';
import { PublicShell } from '../../../components/public/public-shell';
import { resendVerificationCode, verifyEmailCode } from './actions';

export const metadata = { title: 'Verify email' };

function readEmail(value: string | undefined) {
  const email = value?.trim().toLowerCase() ?? '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export default async function VerifyEmailPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ email?: string }> }>) {
  const { email: rawEmail } = await searchParams;
  const email = readEmail(rawEmail);

  return (
    <PublicShell actionHref="/sign-in" actionLabel="Sign in">
      <main className="relative flex flex-1 items-center overflow-hidden bg-[#080808] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgb(16_163_127_/_24%),transparent_34%),radial-gradient(circle_at_88%_78%,rgb(56_130_215_/_12%),transparent_28%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(255_255_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.035)_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div className="relative mx-auto w-full max-w-xl">
          <div className="mb-7 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#5ee8bd]/30 bg-[#5ee8bd]/10 shadow-[0_16px_45px_rgb(16_163_127_/_16%)]">
              <svg
                aria-hidden="true"
                className="size-6 text-[#82e7bd]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 9V7a7 7 0 0 1 14 0v2M5 9h14v11H5V9Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </div>
            <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#82e7bd]">
              One final security check
            </p>
          </div>

          <Card className="relative overflow-hidden border-white/10 bg-[#101815]/95 text-white shadow-[0_32px_100px_rgb(0_0_0_/_42%)] backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#76e8bd] to-transparent"
            />
            <CardHeader className="p-7 pb-0 text-center sm:p-9 sm:pb-0">
              <CardTitle className="text-3xl tracking-[-0.05em] sm:text-4xl">
                Verify your email
              </CardTitle>
              <CardDescription className="mx-auto max-w-md text-base leading-7 text-[#b7c7c1]">
                {email
                  ? `Enter the code we sent to ${email}.`
                  : 'Open this page from account creation so we know where to verify your code.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-7 sm:p-9">
              {email ? (
                <EmailVerificationForm
                  email={email}
                  resendAction={resendVerificationCode}
                  verifyAction={verifyEmailCode}
                />
              ) : (
                <Link
                  className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--cl-color-primary)] px-5 text-base font-bold text-white shadow-[0_16px_42px_rgb(16_163_127_/_25%)] transition-colors hover:bg-[var(--cl-color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78ecc0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101815]"
                  href="/sign-up"
                >
                  Return to account creation
                </Link>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-[#91a49d]">
            <span className="size-1.5 rounded-full bg-[#5ee8bd] shadow-[0_0_12px_rgb(94_232_189_/_65%)]" />
            Codes expire automatically and attempts are rate limited.
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
