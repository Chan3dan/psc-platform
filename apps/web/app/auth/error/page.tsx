import Link from 'next/link';

type AuthErrorPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function resolveErrorLabel(raw: string | undefined) {
  switch (raw) {
    case 'OAuthAccountNotLinked':
      return 'This email is already registered with another sign-in method.';
    case 'AccessDenied':
      return 'Access was denied. Please try again.';
    case 'Configuration':
      return 'Authentication is not configured correctly.';
    case 'Verification':
      return 'Your verification link is invalid or expired.';
    default:
      return 'Unable to sign in right now. Please try again.';
  }
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const rawError = Array.isArray(searchParams?.error)
    ? searchParams?.error[0]
    : searchParams?.error;

  return (
    <div className="min-h-screen px-4 flex items-center justify-center">
      <div className="card glass w-full max-w-md p-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Sign-in error</h1>
        <p className="text-sm text-[var(--muted)]">{resolveErrorLabel(rawError)}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/login" className="btn-primary py-2.5 px-5">
            Back to Login
          </Link>
          <Link href="/" className="btn-secondary py-2.5 px-5">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
