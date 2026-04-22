'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppIcon } from '@/components/icons/AppIcon';
import { ADMIN_PREFETCH_ROUTES, USER_PREFETCH_ROUTES, prefetchRoutes } from '@/lib/route-prefetch';

const PRIMARY_ADMIN_TABS = [
  { href: '/admin', label: 'Overview', icon: 'dashboard' },
  { href: '/admin/questions', label: 'Questions', icon: 'questions' },
  { href: '/admin/mocks', label: 'Mocks', icon: 'mock' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    prefetchRoutes(router, ADMIN_PREFETCH_ROUTES, pathname);
    prefetchRoutes(router, USER_PREFETCH_ROUTES, pathname);
  }, [pathname, router]);

  return (
    <nav className="md:hidden fixed bottom-2 left-3 right-3 z-50 glass rounded-2xl shadow-2xl border border-[var(--line)] safe-bottom">
      <div className="grid grid-cols-5">
        {PRIMARY_ADMIN_TABS.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] transition-all ${
                active ? 'text-[var(--brand)] font-semibold' : 'text-[var(--muted)]'
              }`}
            >
              <span className="h-5 w-5 flex items-center justify-center">
                <AppIcon name={item.icon as any} className="h-[18px] w-[18px]" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
