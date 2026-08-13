export function SignInErrorAlert({
  error,
  verified,
}: {
  error: string | undefined;
  verified?: string | undefined;
}) {
  if (verified === '1') {
    return (
      <p
        aria-atomic="true"
        className="mb-5 rounded-xl border border-[#5ee8bd]/25 bg-[#5ee8bd]/10 px-4 py-3 text-sm leading-6 text-[#9cf0d0]"
        role="status"
      >
        Email verified. Sign in to open your workspace.
      </p>
    );
  }

  if (error !== 'auth') {
    return null;
  }

  return (
    <p
      aria-atomic="true"
      className="mb-5 text-sm text-[var(--cl-color-destructive)]"
      role="alert"
    >
      We could not complete authentication. Please try again.
    </p>
  );
}
