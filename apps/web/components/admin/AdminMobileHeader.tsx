'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ADMIN_NAV_ITEMS } from '@/components/admin/admin-nav-items';

interface AdminMobileHeaderProps {
  user: { name?: string | null; email?: string | null };
}

export function AdminMobileHeader({ user }: AdminMobileHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = user.name?.split(' ')[0] ?? 'Admin';

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 px-3 pt-3 pb-2">
        <div className="glass rounded-2xl border border-[var(--line)] shadow-[var(--shadow-soft)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-orange-600">PSC Admin</p>
              <p className="text-sm font-semibold text-[var(--text)] truncate">Hi, {firstName}</p>
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              className="btn-secondary !px-3 !py-2 shrink-0"
              aria-label="Open admin navigation menu"
            >
              Menu
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <button
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
            aria-label="Close admin navigation menu"
          />
          <div className="absolute inset-y-0 left-0 w-[88vw] max-w-sm bg-[var(--bg-elev)] border-r border-[var(--line)] shadow-[var(--shadow-strong)] flex flex-col">
            <div className="px-4 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-[var(--text)]">PSC Admin</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">Manage the whole platform</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="btn-secondary !px-3 !py-2">
                Close
              </button>
            </div>

            <div className="px-3 pt-3">
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center rounded-2xl border border-[var(--line)] bg-white/80 dark:bg-white/5 px-3 py-3 text-sm font-medium text-[var(--text)] transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]/40"
              >
                Back to App
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${
                      active
                        ? 'bg-[var(--brand-soft)] text-[var(--brand)] font-semibold'
                        : 'text-[var(--muted)] hover:bg-[var(--brand-soft)]/45 hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="text-base w-5 text-center leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-3 border-t border-[var(--line)] space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-sm font-semibold text-[var(--brand)] shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary w-full !justify-center"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
