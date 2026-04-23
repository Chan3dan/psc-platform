'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App route error', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-10">
      <section className="card glass max-w-xl w-full p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text)]">We could not load this page safely.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Please retry once. If the issue continues, open the dashboard or sign in again.
        </p>
        {error.digest ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-300">
            Error digest: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Go to dashboard
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
