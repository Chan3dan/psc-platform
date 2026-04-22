'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminResultsClient } from '@/components/admin/AdminResultsClient';

export function AdminResultsPageClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-results'],
    queryFn: async () => {
      const response = await fetch('/api/admin/results');
      const payload = await response.json();
      return payload.data ?? [];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return <AdminResultsClient results={data ?? []} isLoading={isLoading} />;
}
