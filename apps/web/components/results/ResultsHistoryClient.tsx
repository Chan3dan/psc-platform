'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDuration, formatResultDate } from '@/lib/results';

type ResultFilter = 'all' | 'flagged' | 'mock' | 'practice' | 'daily_question';

const PAGE_SIZE = 12;

export function ResultsHistoryClient({ results, isLoading = false }: { results: any[]; isLoading?: boolean }) {
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const avgAccuracy = results.length > 0
    ? Math.round(results.reduce((sum, result) => sum + Number(result.accuracy_percent ?? 0), 0) / results.length)
    : 0;
  const flaggedAttempts = results.filter((result) => Number(result.flagged_count ?? 0) > 0).length;

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let nextResults = results;

    if (filter === 'flagged') {
      nextResults = nextResults.filter((result) => Number(result.flagged_count ?? 0) > 0);
    } else if (filter === 'mock' || filter === 'practice' || filter === 'daily_question') {
      nextResults = nextResults.filter((result) => result.test_type === filter);
    }

    if (!normalizedQuery) return nextResults;

    return nextResults.filter((result) => {
      const haystack = [
        result.test_id?.title,
        result.result_context?.label,
        result.exam_id?.name,
        result.test_type,
        formatResultDate(result.created_at),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [results, filter, query]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE));
  const paginatedResults = filteredResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

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
        <p className="text-sm text-[var(--muted)] mt-1">Review your mock tests, practice, and daily question attempts in one searchable table.</p>
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
          Active filter: <span className="font-semibold text-[var(--text)] capitalize">{filter === 'all' ? 'All attempts' : filter.replace('_', ' ')}</span>
          {' · '}
          Average accuracy: <span className="font-semibold text-[var(--text)]">{avgAccuracy}%</span>
          {' · '}
          Latest duration: <span className="font-semibold text-[var(--text)]">{results[0] ? formatDuration(results[0].total_time_seconds) : '-'}</span>
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text)] text-sm">Attempt History</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Showing {filteredResults.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredResults.length)} of {filteredResults.length} attempts.
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exam, mock, type, date..."
            className="h-10 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--brand)] lg:w-80"
          />
        </div>

        {isLoading && filteredResults.length === 0 ? (
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">Loading your recent attempts...</div>
        ) : filteredResults.length === 0 ? (
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">No attempts match the current filter.</div>
        ) : (
          <>
            <div className="divide-y divide-[var(--line)] md:hidden">
              {paginatedResults.map((result: any) => (
                <ResultMobileCard key={result._id} result={result} href={`/results/${result._id}`} />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-[var(--brand-soft)]/35">
                  <tr>
                    {['Attempt', 'Exam', 'Type', 'Score', 'Accuracy', 'Breakdown', 'Submitted', 'Review'].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {paginatedResults.map((result: any) => (
                    <ResultTableRow key={result._id} result={result} href={`/results/${result._id}`} />
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function ResultMobileCard({ result, href }: { result: any; href: string }) {
  const flaggedCount = Number(result.flagged_count ?? 0);
  const pct = result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0;

  return (
    <Link href={href} className="block px-4 py-4 hover:bg-[var(--brand-soft)]/30 transition-colors">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="badge-gray">{result.result_context?.label ?? result.test_type}</span>
            {flaggedCount > 0 && <span className="badge-amber">{flaggedCount} flagged</span>}
          </div>
          <p className="text-sm font-medium text-[var(--text)]">
            {result.test_id?.title ?? result.result_context?.label ?? 'Practice Session'}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            {result.exam_id?.name ?? 'Unknown exam'} · {formatResultDate(result.created_at)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className={`text-sm font-semibold ${pct >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{result.score}/{result.max_score}</p>
          <p className="text-xs text-[var(--muted)]">{result.accuracy_percent}% accuracy</p>
        </div>
      </div>
    </Link>
  );
}

function ResultTableRow({ result, href }: { result: any; href: string }) {
  const flaggedCount = Number(result.flagged_count ?? 0);
  const pct = result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0;

  return (
    <tr className="hover:bg-[var(--brand-soft)]/25">
      <td className="px-5 py-4">
        <p className="font-medium text-[var(--text)]">{result.test_id?.title ?? result.result_context?.label ?? 'Practice Session'}</p>
        {flaggedCount > 0 && <span className="badge-amber mt-2 inline-flex">{flaggedCount} flagged</span>}
      </td>
      <td className="px-5 py-4 text-[var(--muted)]">{result.exam_id?.name ?? 'Unknown exam'}</td>
      <td className="px-5 py-4"><span className="badge-gray">{result.result_context?.label ?? result.test_type}</span></td>
      <td className={`px-5 py-4 font-semibold ${pct >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{result.score}/{result.max_score}</td>
      <td className="px-5 py-4 text-[var(--text)] font-medium">{result.accuracy_percent}%</td>
      <td className="px-5 py-4 text-[var(--muted)]">
        {result.correct_count} correct · {result.wrong_count} wrong · {result.skipped_count} skipped
      </td>
      <td className="px-5 py-4 text-[var(--muted)]">{formatDuration(result.total_time_seconds)} · {formatResultDate(result.created_at)}</td>
      <td className="px-5 py-4">
        <Link href={href} className="font-semibold text-[var(--brand)] hover:underline">Review</Link>
      </td>
    </tr>
  );
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (updater: (current: number) => number) => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
      <span>Page {page} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
          className="btn-secondary text-xs disabled:opacity-45"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page === totalPages}
          className="btn-secondary text-xs disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </div>
  );
}
