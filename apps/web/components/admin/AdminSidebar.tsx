'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ADMIN_NAV_ITEMS } from '@/components/admin/admin-nav-items';

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col h-full flex-shrink-0 px-3 py-3">
      <div className="card glass h-full flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-[var(--text)]">PSC Admin</span>
            <p className="text-[11px] uppercase tracking-[0.18em] text-orange-600 mt-1">Control Center</p>
          </div>
          <span className="badge-blue">Live</span>
        </div>

        <div className="px-3 pt-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center rounded-2xl border border-[var(--line)] bg-white/80 dark:bg-white/5 px-3 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]/40"
          >
            Back to App
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)] font-semibold'
                    : 'text-[var(--muted)] hover:bg-white/60 dark:hover:bg-white/5 hover:text-[var(--text)]'
                }`}
              >
                <span className="text-base w-5 text-center leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-[var(--line)]">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-xs font-semibold text-[var(--brand)] flex-shrink-0">
              {user.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[var(--muted)] hover:text-[var(--text)] transition-colors text-sm"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
