'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminFlaggedClient } from '@/components/admin/AdminFlaggedClient';

export function AdminFlaggedPageClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-flagged'],
    queryFn: async () => {
      const response = await fetch('/api/admin/flagged');
      const payload = await response.json();
      return payload.data ?? [];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return <AdminFlaggedClient flaggedItems={data ?? []} isLoading={isLoading} />;
}
