'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
              active
                ? 'bg-[var(--brand-soft)] text-[var(--brand)] font-semibold'
                : 'text-[var(--muted)] hover:bg-[var(--brand-soft)] hover:text-[var(--text)]'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

