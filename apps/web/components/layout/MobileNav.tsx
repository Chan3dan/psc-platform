'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', label: 'Home', icon: '◎' },
  { href: '/practice', label: 'Practice', icon: '✏️' },
  { href: '/mock', label: 'Mock', icon: '⏱' },
  { href: '/planner', label: 'Planner', icon: '📅' },
  { href: '/notes', label: 'Notes', icon: '📚' },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-2 left-3 right-3 z-50 glass rounded-2xl shadow-2xl border border-[var(--line)] flex safe-bottom">
      {TABS.map(item => {
        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-all
              ${active ? 'text-[var(--brand)] font-semibold' : 'text-[var(--muted)]'}`}>
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
