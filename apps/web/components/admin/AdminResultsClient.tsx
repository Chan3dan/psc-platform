'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { formatDuration, formatResultDate } from '@/lib/results';

type AdminResultFilter = 'all' | 'flagged' | 'mock' | 'practice' | 'daily_question';
const PAGE_SIZE = 12;

export function AdminResultsClient({ results, isLoading = false }: { results: any[]; isLoading?: boolean }) {
  const [filter, setFilter] = useState<AdminResultFilter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [dailyResultsOpen, setDailyResultsOpen] = useState(false);
  const [dailyResultsDate, setDailyResultsDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dailyResults, setDailyResults] = useState<any | null>(null);
  const [dailyResultsLoading, setDailyResultsLoading] = useState(false);
  const [dailyResultsError, setDailyResultsError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!dailyResultsOpen || !dailyResultsDate) return;
    let cancelled = false;

    async function loadDailyResults() {
      setDailyResultsLoading(true);
      setDailyResultsError('');
      try {
        const response = await fetch(`/api/admin/daily-question-results?date=${encodeURIComponent(dailyResultsDate)}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error ?? 'Could not load daily question results');
        }
        if (!cancelled) setDailyResults(payload.data);
      } catch (error) {
        if (!cancelled) {
          setDailyResults(null);
          setDailyResultsError(error instanceof Error ? error.message : 'Could not load daily question results');
        }
      } finally {
        if (!cancelled) setDailyResultsLoading(false);
      }
    }

    loadDailyResults();
    return () => {
      cancelled = true;
    };
  }, [dailyResultsOpen, dailyResultsDate]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const regularResults = results.filter((result) => result.test_type !== 'daily_question');
    let nextResults = regularResults;

    if (filter === 'flagged') {
      nextResults = nextResults.filter((result) => Number(result.flagged_count ?? 0) > 0);
    } else if (filter === 'mock' || filter === 'practice') {
      nextResults = nextResults.filter((result) => result.test_type === filter);
    }

    if (!normalizedQuery) return nextResults;

    return nextResults.filter((result) => {
      const haystack = [
        result.test_id?.title,
        result.result_context?.label,
        result.user_id?.name,
        result.user_id?.email,
        result.user_id?._id,
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

  function openDailyQuestionResult(result?: any) {
    const submittedDate = result?.result_context?.submitted_for_date;
    if (submittedDate) setDailyResultsDate(submittedDate);
    setDailyResultsOpen(true);
  }

  const regularResults = results.filter((result) => result.test_type !== 'daily_question');
  const filterCards = [
    { key: 'all' as const, label: 'Recent Attempts', value: regularResults.length, tone: 'text-blue-600' },
    { key: 'flagged' as const, label: 'Flagged Attempts', value: regularResults.filter((result) => Number(result.flagged_count ?? 0) > 0).length, tone: 'text-amber-600' },
    { key: 'mock' as const, label: 'Mock Attempts', value: regularResults.filter((result) => result.test_type === 'mock').length, tone: 'text-emerald-600' },
    { key: 'practice' as const, label: 'Practice Attempts', value: regularResults.filter((result) => result.test_type === 'practice').length, tone: 'text-purple-600' },
    { key: 'daily_question' as const, label: 'Daily Questions', value: results.filter((result) => result.test_type === 'daily_question').length, tone: 'text-indigo-600' },
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
              onClick={() => {
                if (stat.key === 'daily_question') {
                  setDailyResultsOpen(true);
                  return;
                }
                setFilter(stat.key);
              }}
              className={`card p-4 md:p-5 text-left transition border ${active ? 'border-[var(--brand)] ring-2 ring-[color:color-mix(in_oklab,var(--brand)_24%,transparent)]' : 'border-[var(--line)] hover:border-[var(--brand)]/30'}`}
            >
              <div className={`text-xl md:text-2xl font-bold ${stat.tone}`}>{stat.value}</div>
              <div className="text-xs md:text-sm text-[var(--muted)] mt-1">{stat.label}</div>
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)] flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text)] text-sm">Attempt Queue</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Showing {filteredResults.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredResults.length)} of {filteredResults.length}. Search supports name, email, user id, exam, mock, and date.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search user, email, exam, date..."
              className="h-10 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--brand)] sm:w-72"
            />
            <button type="button" onClick={() => setDailyResultsOpen(true)} className="btn-secondary text-xs !px-3 !py-2">
              Daily question table
            </button>
            <Link href="/admin/flagged" className="btn-secondary text-xs !px-3 !py-2">
              Open flagged queue
            </Link>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">
            {isLoading ? 'Loading attempt queue…' : 'No attempts match the current filter.'}
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-[var(--line)]">
              {paginatedResults.map((result: any) => {
                const flaggedCount = Number(result.flagged_count ?? 0);
                const isDailyQuestion = result.test_type === 'daily_question' && result.daily_question_preview;
                return (
                  <div
                    key={result._id}
                    role={isDailyQuestion ? 'button' : undefined}
                    tabIndex={isDailyQuestion ? 0 : undefined}
                    onClick={() => {
                      if (isDailyQuestion) openDailyQuestionResult(result);
                    }}
                    onKeyDown={(event) => {
                      if (isDailyQuestion && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        openDailyQuestionResult(result);
                      }
                    }}
                    className={`block px-4 py-3 space-y-2 transition-colors ${isDailyQuestion ? 'cursor-pointer hover:bg-[var(--brand-soft)]/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text)] truncate">{result.test_id?.title ?? result.result_context?.label ?? 'Practice Session'}</p>
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
                    {isDailyQuestion ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDailyQuestionResult(result);
                        }}
                        className="text-xs font-semibold text-[var(--brand)]"
                      >
                        Open daily question result
                      </button>
                    ) : (
                      <Link href={`/admin/results/${result._id}`} className="text-xs font-semibold text-[var(--brand)]">
                        Review full result
                      </Link>
                    )}
                  </div>
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
                  {paginatedResults.map((result: any) => {
                    const flaggedCount = Number(result.flagged_count ?? 0);
                    const isDailyQuestion = result.test_type === 'daily_question' && result.daily_question_preview;
                    return (
                      <tr
                        key={result._id}
                        onClick={() => {
                          if (isDailyQuestion) openDailyQuestionResult(result);
                        }}
                        className={`hover:bg-[var(--brand-soft)]/25 ${isDailyQuestion ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-6 py-3 font-medium text-[var(--text)]">{result.test_id?.title ?? result.result_context?.label ?? 'Practice Session'}</td>
                        <td className="px-6 py-3 text-[var(--muted)]">
                          <div className="space-y-1">
                            <p className="text-[var(--text)]">{result.user_id?.name ?? 'Unknown user'}</p>
                            <p className="text-xs">{result.user_id?.email ?? 'No email'}</p>
                            {result.user_id?._id && (
                              <Link
                                href={`/admin/users?query=${encodeURIComponent(result.user_id.email ?? result.user_id._id)}`}
                                onClick={(event) => event.stopPropagation()}
                                className="text-xs text-[var(--brand)] hover:underline"
                              >
                                Find user
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-[var(--muted)]">{result.exam_id?.name ?? 'Unknown exam'}</td>
                        <td className="px-6 py-3"><span className="badge-gray">{result.result_context?.label ?? result.test_type}</span></td>
                        <td className="px-6 py-3 text-[var(--text)] font-semibold">{result.score}/{result.max_score}</td>
                        <td className="px-6 py-3">
                          <span className={`badge ${flaggedCount > 0 ? 'badge-amber' : 'badge-gray'}`}>{flaggedCount}</span>
                        </td>
                        <td className="px-6 py-3 text-[var(--muted)]">{formatDuration(result.total_time_seconds)} · {formatResultDate(result.created_at)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {result.test_type === 'daily_question' && result.daily_question_preview && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDailyQuestionResult(result);
                                }}
                                className="text-[var(--brand)] font-medium hover:underline"
                              >
                                View result
                              </button>
                            )}
                            {result.test_type !== 'daily_question' && (
                              <Link href={`/admin/results/${result._id}`} className="text-[var(--brand)] font-medium hover:underline">Review</Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
          </>
        )}
      </div>

      {mounted && dailyResultsOpen && createPortal(
        <div
          className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-0 md:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDailyResultsOpen(false);
          }}
        >
          <section className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-6xl bg-[var(--bg-elev)] border border-[var(--line)] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <header className="flex flex-col gap-3 border-b border-[var(--line)] px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">Question of the Day Results</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Review every user answer for a selected date in one table.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={dailyResultsDate}
                  onChange={(event) => setDailyResultsDate(event.target.value)}
                  className="h-10 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"
                />
                <button onClick={() => setDailyResultsOpen(false)} className="btn-secondary text-xs px-3 py-1.5">
                  Close
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
              {dailyResultsLoading ? (
                <div className="h-56 animate-pulse rounded-3xl bg-[var(--brand-soft)]/25" />
              ) : dailyResultsError ? (
                <div className="rounded-2xl border border-red-300/60 bg-red-50/90 p-5 text-sm text-red-600">
                  {dailyResultsError}
                </div>
              ) : dailyResults ? (
                <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/45 p-3">
                  <p className="text-xs text-[var(--muted)]">Answers</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{dailyResults.summary?.total ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/45 p-3">
                  <p className="text-xs text-[var(--muted)]">Correct</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-600">{dailyResults.summary?.correct ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/45 p-3">
                  <p className="text-xs text-[var(--muted)]">Wrong</p>
                  <p className="mt-1 text-xl font-semibold text-red-600">{dailyResults.summary?.wrong ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/45 p-3">
                  <p className="text-xs text-[var(--muted)]">Accuracy</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{dailyResults.summary?.accuracy_percent ?? 0}%</p>
                </div>
              </div>

              {dailyResults.questionSummaries?.length > 0 && (
                <div className="grid gap-3 lg:grid-cols-2">
                  {dailyResults.questionSummaries.map((question: any) => (
                    <div key={question.question_of_day_id} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        {question.exam_name} · {question.subject_name}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">{question.question_text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg)]/35">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-[var(--brand-soft)]/35">
                    <tr>
                      {['User', 'Exam', 'Subject', 'Selected', 'Result', 'Score', 'Time', 'Submitted', 'Review'].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {(dailyResults.rows ?? []).map((row: any) => (
                      <tr key={row.result_id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--text)]">{row.user_name}</p>
                          <p className="text-xs text-[var(--muted)]">{row.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">{row.exam_name}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{row.subject_name}</td>
                        <td className="px-4 py-3 text-[var(--text)]">{row.selected_label}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${row.is_correct ? 'badge-green' : 'badge-amber'}`}>
                            {row.is_correct ? 'Correct' : 'Wrong'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.score}/{row.max_score}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{formatDuration(row.total_time_seconds)}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{formatResultDate(row.submitted_at)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/results/${row.result_id}`} className="text-[var(--brand)] font-medium hover:underline">
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dailyResults.rows?.length === 0 && (
                  <p className="p-5 text-sm text-[var(--muted)]">No users answered the question of the day for this date.</p>
                )}
              </div>
                </>
              ) : (
                <p className="text-sm text-[var(--muted)]">Choose a date to load daily question results.</p>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
