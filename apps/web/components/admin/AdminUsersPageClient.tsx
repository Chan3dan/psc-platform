'use client';

import { useQuery } from '@tanstack/react-query';
import { UsersTable } from '@/components/admin/UsersTable';

export function AdminUsersPageClient({ initialQuery = '' }: { initialQuery?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      const payload = await response.json();
      return payload.data ?? [];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Users</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Search, filter, and review user activity.</p>
      </div>

      <UsersTable users={data ?? []} initialQuery={initialQuery} isLoading={isLoading} />
    </div>
  );
}
