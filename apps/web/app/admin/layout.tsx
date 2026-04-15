// ── FILE: app/admin/layout.tsx ───────────────────────────────
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/exams', label: 'Exams' },
  { href: '/admin/subjects', label: 'Subjects' },
  { href: '/admin/questions', label: 'Questions' },
  { href: '/admin/mocks', label: 'Mocks' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/notes', label: 'Notes' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') redirect('/dashboard');
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 md:px-6 py-3 flex items-center gap-4 flex-wrap glass border-b border-[var(--line)]">
        <span className="text-sm font-semibold text-orange-600">PSC Admin</span>
        <AdminNav items={ADMIN_NAV} />
        <Link href="/dashboard" className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--text)]">Back to app</Link>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  );
}
