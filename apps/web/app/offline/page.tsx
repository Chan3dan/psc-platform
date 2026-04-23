import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-10">
      <section className="card glass max-w-lg w-full p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">You&apos;re offline.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Questions you&apos;ve started will sync when you reconnect. You can continue cached
          practice and mock sessions if they were loaded on this device before.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">
            Go to dashboard
          </Link>
          <Link href="/practice" className="btn-secondary">
            Open practice
          </Link>
        </div>
      </section>
    </main>
  );
}
