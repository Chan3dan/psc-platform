import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { getUserPreferences } from '@/lib/user-preferences';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const preferences = await getUserPreferences(session.user.id);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session.user as any} targetExamName={preferences.targetExam?.name ?? ''} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/25" />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
          <MobileHeader user={session.user as any} targetExamName={preferences.targetExam?.name ?? ''} />
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
