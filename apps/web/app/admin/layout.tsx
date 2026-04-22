import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileHeader } from '@/components/admin/AdminMobileHeader';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') redirect('/dashboard');

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar user={session.user as any} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-100/55 to-transparent dark:from-orange-900/20" />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-10 relative">
          <AdminMobileHeader user={session.user as any} />
          {children}
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
