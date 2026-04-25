'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { SearchModal } from '@/components/layout/SearchModal';
import { APP_NAV_ITEMS } from '@/components/layout/nav-items';
import { AppIcon } from '@/components/icons/AppIcon';
import { BrandMark } from '@/components/branding/BrandMark';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useSiteSettings } from '@/components/branding/SiteSettingsProvider';
import { ADMIN_PREFETCH_ROUTES, USER_PREFETCH_ROUTES, prefetchRoutes } from '@/lib/route-prefetch';

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string };
  targetExamName?: string;
}

export function Sidebar({ user, targetExamName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const settings = useSiteSettings();

  useEffect(() => {
    prefetchRoutes(router, USER_PREFETCH_ROUTES, pathname);
    if (user.role === 'admin') {
      prefetchRoutes(router, ADMIN_PREFETCH_ROUTES, pathname);
    }
  }, [pathname, router, user.role]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <aside className="hidden md:flex w-64 flex-col h-full flex-shrink-0 px-3 py-3">
      <div className="card glass h-full flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <BrandMark href="/dashboard" name={settings.brandName} logoUrl={settings.logoUrl} compact />
          <span className="badge-blue">{settings.liveLabel}</span>
        </div>
        <div className="px-3 pt-3">
          <ThemeToggle className="mb-2 w-full !justify-center !px-3" />
          <button
            className="w-full input text-left text-sm text-[var(--muted)] hover:text-[var(--text)]"
            onClick={() => setSearchOpen(true)}
          >
            Search... <span className="float-right text-xs opacity-70">Ctrl/⌘ K</span>
          </button>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {APP_NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                  ${active
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)] font-semibold'
                    : 'text-[var(--muted)] hover:bg-white/60 dark:hover:bg-white/5 hover:text-[var(--text)]'
                  }`}>
                <span className="w-5 h-5 flex items-center justify-center">
                  <AppIcon name={item.icon as any} className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </Link>
            );
          })}
          {user.role === 'admin' && (
            <Link href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors mt-1">
              <span className="w-5 h-5 flex items-center justify-center">
                <AppIcon name="admin" className="h-[18px] w-[18px]" />
              </span>
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="px-3 py-3 border-t border-[var(--line)]">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-xs font-semibold text-[var(--brand)] flex-shrink-0">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
              {targetExamName ? <p className="text-[11px] text-[var(--brand)] truncate mt-0.5">{targetExamName}</p> : null}
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[var(--muted)] hover:text-[var(--text)] transition-colors text-sm" title="Sign out">
              <AppIcon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </aside>
  );
}
