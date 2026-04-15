'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  user?: { role?: string };
}

const BASE_TABS = [
  { href: '/dashboard', label: 'Home', icon: '◎' },
  { href: '/practice', label: 'Practice', icon: '✏️' },
  { href: '/mock', label: 'Mock', icon: '⏱' },
  { href: '/planner', label: 'Planner', icon: '📅' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/notes', label: 'Notes', icon: '📚' },
];

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const tabs = user?.role === 'admin'
    ? [...BASE_TABS, { href: '/admin', label: 'Admin', icon: '⚙️' }]
    : BASE_TABS;

  return (
    <nav className="md:hidden fixed bottom-2 left-3 right-3 z-50 glass rounded-2xl shadow-2xl border border-[var(--line)] safe-bottom overflow-x-auto scrollbar-hide">
      <div className="flex min-w-max">
      {tabs.map(item => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}
            className={`min-w-[72px] flex flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] transition-all
              ${active ? 'text-[var(--brand)] font-semibold' : 'text-[var(--muted)]'}`}>
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
