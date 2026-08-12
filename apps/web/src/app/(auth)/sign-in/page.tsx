import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@candorlens/ui';

import { AuthForm } from '../../../components/auth/auth-form';
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
    <main className="mx-auto flex min-h-[calc(100dvh-var(--cl-nav-height))] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Sign in to CandorLens</CardTitle>
          <CardDescription>
            Continue to your consent-first interview workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInErrorAlert error={error} />
          <AuthForm action={signIn} mode="sign-in" />
        </CardContent>
      </Card>
    </main>
  );
}
