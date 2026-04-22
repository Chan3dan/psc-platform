import { AdminUsersPageClient } from '@/components/admin/AdminUsersPageClient';

export default function AdminUsersPage({ searchParams }: { searchParams?: { query?: string } }) {
  return <AdminUsersPageClient initialQuery={searchParams?.query ?? ''} />;
}
