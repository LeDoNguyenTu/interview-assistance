export function SignInErrorAlert({ error }: { error: string | undefined }) {
  if (error !== 'auth') {
    return null;
  }

  return (
    <p aria-atomic="true" className="mb-5 text-sm text-[var(--cl-color-destructive)]" role="alert">
      We could not complete authentication. Please try again.
    </p>
  );
}
