'use client';

import { useQuery } from '@tanstack/react-query';
import { ExamManager } from '@/components/admin/ExamManager';

export default function AdminExamsPage() {
  const { data: exams = [], isLoading, error } = useQuery({
    queryKey: ['admin-exams-page'],
    queryFn: async () => {
      const response = await fetch('/api/exams?admin=1', { cache: 'no-store' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error ?? 'Could not load exams');
      return data.data ?? [];
    },
  });

  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Exams</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Manage all exam types. Changes apply platform-wide.</p>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">Loading exams...</div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-medium text-red-500">Could not load exams right now.</p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      ) : (
        <ExamManager initialExams={exams} />
      )}
    </div>
  );
}
