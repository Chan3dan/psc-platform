'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDuration, formatResultDate } from '@/lib/results';

type ResultFilter = 'all' | 'flagged' | 'mock' | 'practice' | 'daily_question';

export function ResultsHistoryClient({ results, isLoading = false }: { results: any[]; isLoading?: boolean }) {
  const [filter, setFilter] = useState<ResultFilter>('all');

  const avgAccuracy = results.length > 0
    ? Math.round(results.reduce((sum, result) => sum + Number(result.accuracy_percent ?? 0), 0) / results.length)
    : 0;
  const flaggedAttempts = results.filter((result) => Number(result.flagged_count ?? 0) > 0).length;

  const filteredResults = useMemo(() => {
    if (filter === 'flagged') {
      return results.filter((result) => Number(result.flagged_count ?? 0) > 0);
    }
    if (filter === 'mock' || filter === 'practice' || filter === 'daily_question') {
      return results.filter((result) => result.test_type === filter);
    }
    return results;
  }, [results, filter]);

  const filterCards = [
    { key: 'all' as const, label: 'Attempts', value: results.length, tone: 'text-blue-600' },
    { key: 'mock' as const, label: 'Mock Attempts', value: results.filter((result) => result.test_type === 'mock').length, tone: 'text-emerald-600' },
    { key: 'flagged' as const, label: 'Flagged Attempts', value: flaggedAttempts, tone: 'text-amber-600' },
    { key: 'practice' as const, label: 'Practice Attempts', value: results.filter((result) => result.test_type === 'practice').length, tone: 'text-purple-600' },
    { key: 'daily_question' as const, label: 'Daily Questions', value: results.filter((result) => result.test_type === 'daily_question').length, tone: 'text-indigo-600' },
  ];

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Results</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Review your recent mock tests and practice attempts in one place.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {filterCards.map((stat) => {
          const active = filter === stat.key;
          return (
            <button
              key={stat.label}
              onClick={() => setFilter(stat.key)}
              className={`card p-4 md:p-5 text-left transition border ${active ? 'border-[var(--brand)] ring-2 ring-[color:color-mix(in_oklab,var(--brand)_24%,transparent)]' : 'border-[var(--line)] hover:border-[var(--brand)]/30'}`}
            >
              <div className={`text-xl md:text-2xl font-bold ${stat.tone}`}>{stat.value}</div>
              <div className="text-xs md:text-sm text-[var(--muted)] mt-1">{stat.label}</div>
            </button>
          );
        })}
      </div>

      <div className="card p-4 md:p-5">
        <p className="text-xs text-[var(--muted)]">
          Active filter: <span className="font-semibold text-[var(--text)] capitalize">{filter === 'all' ? 'All attempts' : filter}</span>
          {' · '}
          Average accuracy: <span className="font-semibold text-[var(--text)]">{avgAccuracy}%</span>
          {' · '}
          Latest duration: <span className="font-semibold text-[var(--text)]">{results[0] ? formatDuration(results[0].total_time_seconds) : '—'}</span>
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)]">
          <h2 className="font-semibold text-[var(--text)] text-sm">Attempt History</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Click any attempt to open its full review page.</p>
        </div>

        {isLoading && filteredResults.length === 0 ? (
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">Loading your recent attempts…</div>
        ) : filteredResults.length === 0 ? (
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">
            No attempts match the current filter.
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filteredResults.map((result: any) => {
              const flaggedCount = Number(result.flagged_count ?? 0);
              const pct = result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0;
              return (
                <Link
                  key={result._id}
                  href={`/results/${result._id}`}
                  className="block px-4 md:px-6 py-4 hover:bg-[var(--brand-soft)]/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="badge-gray">{result.result_context?.label ?? result.test_type}</span>
                        {flaggedCount > 0 && <span className="badge-amber">{flaggedCount} flagged</span>}
                        <span className="text-xs text-[var(--muted)]">{result.exam_id?.name ?? 'Unknown exam'}</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--text)]">
                        {result.test_id?.title ?? result.result_context?.label ?? 'Practice Session'}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        {formatDuration(result.total_time_seconds)} · {result.correct_count} correct · {result.wrong_count} wrong · {result.skipped_count} skipped
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className={`text-sm font-semibold ${pct >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{result.score}/{result.max_score}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{formatResultDate(result.created_at)} · {result.accuracy_percent}% accuracy</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
