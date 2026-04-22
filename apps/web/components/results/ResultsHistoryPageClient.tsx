'use client';

import { useQuery } from '@tanstack/react-query';
import { ResultsHistoryClient } from '@/components/results/ResultsHistoryClient';

export function ResultsHistoryPageClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['results-history'],
    queryFn: async () => {
      const response = await fetch('/api/results/history');
      const payload = await response.json();
      return payload.data ?? [];
    },
    staleTime: 45_000,
    gcTime: 5 * 60_000,
  });

  return <ResultsHistoryClient results={data ?? []} isLoading={isLoading} />;
}
