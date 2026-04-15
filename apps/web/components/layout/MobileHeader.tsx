'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { APP_NAV_ITEMS } from '@/components/layout/nav-items';
import { AppIcon } from '@/components/icons/AppIcon';
import { BrandMark } from '@/components/branding/BrandMark';
import { useSiteSettings } from '@/components/branding/SiteSettingsProvider';

interface MobileHeaderProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = user.name?.split(' ')[0] ?? 'User';
  const settings = useSiteSettings();

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
            <div className="min-w-0 flex-1">
              <BrandMark
                name={settings.brandName}
                logoUrl={settings.logoUrl}
                subtitle={`Hi, ${firstName}`}
                compact
                hideSubtitleOnMobile={false}
              />
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              className="btn-secondary !px-3 !py-2 shrink-0"
              aria-label="Open navigation menu"
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
            aria-label="Close navigation menu"
          />
          <div className="absolute inset-y-0 left-0 w-[88vw] max-w-sm bg-[var(--bg-elev)] border-r border-[var(--line)] shadow-[var(--shadow-strong)] flex flex-col">
            <div className="px-4 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <BrandMark
                name={settings.brandName}
                logoUrl={settings.logoUrl}
                subtitle="Everything in one menu"
                hideSubtitleOnMobile
              />
              <button onClick={() => setMenuOpen(false)} className="btn-secondary !px-3 !py-2">
                Close
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {APP_NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
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
                    <span className="w-5 h-5 flex items-center justify-center">
                      <AppIcon name={item.icon as any} className="h-[18px] w-[18px]" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="group flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 transition-all mt-2"
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    <AppIcon name="admin" className="h-[18px] w-[18px]" />
                  </span>
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>

            <div className="px-3 py-3 border-t border-[var(--line)] space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center text-sm font-semibold text-[var(--brand)] shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
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
