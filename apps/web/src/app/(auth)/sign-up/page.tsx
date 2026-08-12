import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@candorlens/ui';

import { AuthForm } from '../../../components/auth/auth-form';
import { signUp } from '../sign-in/actions';

export const metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-var(--cl-nav-height))] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your CandorLens account</CardTitle>
          <CardDescription>Start a consent-first interview workspace.</CardDescription>
        </CardHeader>
        <CardContent><AuthForm action={signUp} mode="sign-up" /></CardContent>
      </Card>
    </main>
  );
}
