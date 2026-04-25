'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppIcon } from '@/components/icons/AppIcon';
import { USER_PREFETCH_ROUTES, prefetchRoutes } from '@/lib/route-prefetch';

const PRIMARY_TABS = [
  { href: '/dashboard', label: 'Home', icon: 'dashboard' },
  { href: '/feed', label: 'Feed', icon: 'idea' },
  { href: '/practice', label: 'Practice', icon: 'practice' },
  { href: '/mock', label: 'Mock', icon: 'mock' },
  { href: '/planner', label: 'Planner', icon: 'planner' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    prefetchRoutes(router, USER_PREFETCH_ROUTES, pathname);
  }, [pathname, router]);

  return (
    <nav className="md:hidden fixed bottom-2 left-3 right-3 z-50 glass rounded-2xl shadow-2xl border border-[var(--line)] safe-bottom">
      <div className="grid grid-cols-5">
      {PRIMARY_TABS.map(item => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] transition-all
              ${active ? 'text-[var(--brand)] font-semibold' : 'text-[var(--muted)]'}`}>
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
