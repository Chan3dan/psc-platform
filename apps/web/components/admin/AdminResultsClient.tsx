'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDuration, formatResultDate } from '@/lib/results';

type AdminResultFilter = 'all' | 'flagged' | 'mock' | 'practice';

export function AdminResultsClient({ results }: { results: any[] }) {
  const [filter, setFilter] = useState<AdminResultFilter>('all');

  const filteredResults = useMemo(() => {
    if (filter === 'flagged') {
      return results.filter((result) => (result.answers ?? []).some((answer: any) => answer.flagged));
    }
    if (filter === 'mock' || filter === 'practice') {
      return results.filter((result) => result.test_type === filter);
    }
    return results;
  }, [results, filter]);

  const filterCards = [
    { key: 'all' as const, label: 'Recent Attempts', value: results.length, tone: 'text-blue-600' },
    { key: 'flagged' as const, label: 'Flagged Attempts', value: results.filter((result) => (result.answers ?? []).some((answer: any) => answer.flagged)).length, tone: 'text-amber-600' },
    { key: 'mock' as const, label: 'Mock Attempts', value: results.filter((result) => result.test_type === 'mock').length, tone: 'text-emerald-600' },
    { key: 'practice' as const, label: 'Practice Attempts', value: results.filter((result) => result.test_type === 'practice').length, tone: 'text-purple-600' },
  ];

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Results</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Review recent attempts, scores, and flagged questions across the platform.</p>
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

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--text)] text-sm">Attempt Queue</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Latest attempts with direct review links.</p>
          </div>
          <Link href="/admin/flagged" className="text-xs text-[var(--brand)] hover:underline">
            Open flagged queue
          </Link>
        </div>

        {filteredResults.length === 0 ? (
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">No attempts match the current filter.</div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-[var(--line)]">
              {filteredResults.map((result: any) => {
                const flaggedCount = (result.answers ?? []).filter((answer: any) => answer.flagged).length;
                return (
                  <Link key={result._id} href={`/admin/results/${result._id}`} className="block px-4 py-3 space-y-2 hover:bg-[var(--brand-soft)]/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text)] truncate">{result.test_id?.title ?? 'Practice Session'}</p>
                        <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                          {result.user_id?.name ?? 'Unknown user'} · {result.user_id?.email ?? 'No email'} · {result.exam_id?.name ?? 'Unknown exam'}
                        </p>
                      </div>
                      <span className={`badge text-xs ${flaggedCount > 0 ? 'badge-amber' : 'badge-gray'}`}>
                        {flaggedCount > 0 ? `${flaggedCount} flagged` : result.test_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>{formatDuration(result.total_time_seconds)} · {formatResultDate(result.created_at)}</span>
                      <span className="font-semibold text-[var(--text)]">{result.score}/{result.max_score}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[920px]">
                <thead className="bg-[var(--brand-soft)]/35">
                  <tr>
                    {['Attempt', 'User', 'Exam', 'Type', 'Score', 'Flagged', 'Submitted', 'View'].map((heading) => (
                      <th key={heading} className="text-left px-6 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredResults.map((result: any) => {
                    const flaggedCount = (result.answers ?? []).filter((answer: any) => answer.flagged).length;
                    return (
                      <tr key={result._id} className="hover:bg-[var(--brand-soft)]/25">
                        <td className="px-6 py-3 font-medium text-[var(--text)]">{result.test_id?.title ?? 'Practice Session'}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">
                          <div className="space-y-1">
                            <p className="text-[var(--text)]">{result.user_id?.name ?? 'Unknown user'}</p>
                            <p className="text-xs">{result.user_id?.email ?? 'No email'}</p>
                            {result.user_id?._id && (
                              <Link
                                href={`/admin/users?query=${encodeURIComponent(result.user_id.email ?? result.user_id._id)}`}
                                className="text-xs text-[var(--brand)] hover:underline"
                              >
                                Find user
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-[var(--muted)]">{result.exam_id?.name ?? 'Unknown exam'}</td>
                        <td className="px-6 py-3"><span className="badge-gray">{result.test_type}</span></td>
                        <td className="px-6 py-3 text-[var(--text)] font-semibold">{result.score}/{result.max_score}</td>
                        <td className="px-6 py-3">
                          <span className={`badge ${flaggedCount > 0 ? 'badge-amber' : 'badge-gray'}`}>{flaggedCount}</span>
                        </td>
                        <td className="px-6 py-3 text-[var(--muted)]">{formatDuration(result.total_time_seconds)} · {formatResultDate(result.created_at)}</td>
                        <td className="px-6 py-3">
                          <Link href={`/admin/results/${result._id}`} className="text-[var(--brand)] font-medium hover:underline">Review</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
