'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface MobileHeaderProps {
  user: { name?: string | null; role?: string };
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const firstName = user.name?.split(' ')[0] ?? 'User';

  return (
    <div className="md:hidden sticky top-0 z-40 px-3 pt-3 pb-2">
      <div className="glass rounded-2xl border border-[var(--line)] shadow-[var(--shadow-soft)] px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">PSC Prep</p>
            <p className="text-sm font-semibold text-[var(--text)] truncate">Hi, {firstName}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-secondary !px-3 !py-2 shrink-0"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/dashboard" className="btn-secondary !px-3 !py-2">Home</Link>
          <Link href="/leaderboard" className="btn-secondary !px-3 !py-2">Leaderboard</Link>
          {user.role === 'admin' && (
            <Link href="/admin" className="btn-secondary !px-3 !py-2">Admin Panel</Link>
          )}
        </div>
      </div>
    </div>
  );
}
