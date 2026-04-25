'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ADMIN_NAV_ITEMS } from '@/components/admin/admin-nav-items';
import { AppIcon } from '@/components/icons/AppIcon';
import { BrandMark } from '@/components/branding/BrandMark';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useSiteSettings } from '@/components/branding/SiteSettingsProvider';
import { ADMIN_PREFETCH_ROUTES, USER_PREFETCH_ROUTES, prefetchRoutes } from '@/lib/route-prefetch';

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSiteSettings();

  useEffect(() => {
    prefetchRoutes(router, ADMIN_PREFETCH_ROUTES, pathname);
    prefetchRoutes(router, USER_PREFETCH_ROUTES, pathname);
  }, [pathname, router]);

  return (
    <aside className="hidden md:flex w-64 flex-col h-full flex-shrink-0 px-3 py-3">
      <div className="card glass h-full flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="min-w-0">
            <BrandMark
              href="/admin"
              name={settings.brandName}
              logoUrl={settings.logoUrl}
              subtitle="Control Center"
              compact
              admin
            />
          </div>
          <span className="badge-blue">{settings.liveLabel}</span>
        </div>

        <div className="px-3 pt-3">
          <ThemeToggle className="mb-2 w-full !justify-center !px-3" />
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] px-3 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]/40"
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
                <span className="w-5 h-5 flex items-center justify-center">
                  <AppIcon name={item.icon as any} className="h-[18px] w-[18px]" />
                </span>
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
              <AppIcon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
