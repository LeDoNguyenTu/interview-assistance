import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

import { AuthForm } from '../../../components/auth/auth-form';
import { signUp } from '../sign-in/actions';

export const metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <main className="relative flex min-h-[calc(100dvh-var(--cl-nav-height))] items-center overflow-hidden bg-[#080808] px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgb(16_163_127_/_18%),transparent_34%)]"
      />
      <Card className="relative mx-auto w-full max-w-lg border-white/10 bg-[#121212] text-white shadow-[0_28px_80px_rgb(0_0_0_/_30%)]">
        <CardHeader className="p-7 pb-0 sm:p-8 sm:pb-0">
          <CardTitle className="text-3xl tracking-[-0.05em]">
            Create your CandorLens account
          </CardTitle>
          <CardDescription className="text-base text-[#b7b7b1]">
            Start a consent-first interview workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-7 sm:p-8">
          <AuthForm action={signUp} mode="sign-up" />
        </CardContent>
      </Card>
    </main>
  );
}
