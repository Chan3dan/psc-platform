'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PRIMARY_TABS = [
  { href: '/dashboard', label: 'Home', icon: '◎' },
  { href: '/practice', label: 'Practice', icon: '✏️' },
  { href: '/mock', label: 'Mock', icon: '⏱' },
  { href: '/planner', label: 'Planner', icon: '📅' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-2 left-3 right-3 z-50 glass rounded-2xl shadow-2xl border border-[var(--line)] safe-bottom">
      <div className="grid grid-cols-5">
      {PRIMARY_TABS.map(item => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] transition-all
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
