'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AppIcon } from '@/components/icons/AppIcon';
import { formatDuration, formatResultDate } from '@/lib/results';

type AdminResultFilter = 'all' | 'flagged' | 'mock' | 'practice' | 'daily_question';

export function AdminResultsClient({ results, isLoading = false }: { results: any[]; isLoading?: boolean }) {
  const [filter, setFilter] = useState<AdminResultFilter>('all');
  const [mounted, setMounted] = useState(false);
  const [previewResult, setPreviewResult] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredResults = useMemo(() => {
    if (filter === 'flagged') {
      return results.filter((result) => Number(result.flagged_count ?? 0) > 0);
    }
    if (filter === 'mock' || filter === 'practice' || filter === 'daily_question') {
      return results.filter((result) => result.test_type === filter);
    }
    return results;
  }, [results, filter]);

  function openDailyQuestionResult(result: any) {
    if (result.test_type === 'daily_question' && result.daily_question_preview) {
      setPreviewResult(result);
    }
  }

  const filterCards = [
    { key: 'all' as const, label: 'Recent Attempts', value: results.length, tone: 'text-blue-600' },
    { key: 'flagged' as const, label: 'Flagged Attempts', value: results.filter((result) => Number(result.flagged_count ?? 0) > 0).length, tone: 'text-amber-600' },
    { key: 'mock' as const, label: 'Mock Attempts', value: results.filter((result) => result.test_type === 'mock').length, tone: 'text-emerald-600' },
    { key: 'practice' as const, label: 'Practice Attempts', value: results.filter((result) => result.test_type === 'practice').length, tone: 'text-purple-600' },
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
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">
            {isLoading ? 'Loading attempt queue…' : 'No attempts match the current filter.'}
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-[var(--line)]">
              {filteredResults.map((result: any) => {
                const flaggedCount = Number(result.flagged_count ?? 0);
                const isDailyQuestion = result.test_type === 'daily_question' && result.daily_question_preview;
                return (
                  <div
                    key={result._id}
                    role={isDailyQuestion ? 'button' : undefined}
                    tabIndex={isDailyQuestion ? 0 : undefined}
                    onClick={() => openDailyQuestionResult(result)}
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
                          setPreviewResult(result);
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
                  {filteredResults.map((result: any) => {
                    const flaggedCount = Number(result.flagged_count ?? 0);
                    return (
                      <tr
                        key={result._id}
                        onClick={() => openDailyQuestionResult(result)}
                        className={`hover:bg-[var(--brand-soft)]/25 ${result.test_type === 'daily_question' && result.daily_question_preview ? 'cursor-pointer' : ''}`}
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
                                  setPreviewResult(result);
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
          </>
        )}
      </div>

      {mounted && previewResult && createPortal(
        <div
          className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-0 md:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewResult(null);
          }}
        >
          <section className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-3xl bg-white dark:bg-slate-950 border border-[var(--line)] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <header className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">Question of the Day Result</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {previewResult.user_id?.name ?? 'Unknown user'} · {previewResult.exam_id?.name ?? 'Unknown exam'} · {formatResultDate(previewResult.created_at)}
                </p>
              </div>
              <button onClick={() => setPreviewResult(null)} className="btn-secondary text-xs px-3 py-1.5">
                Close
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[var(--line)] p-3">
                  <p className="text-xs text-[var(--muted)]">Score</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{previewResult.score}/{previewResult.max_score}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] p-3">
                  <p className="text-xs text-[var(--muted)]">Accuracy</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-600">{previewResult.accuracy_percent}%</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] p-3">
                  <p className="text-xs text-[var(--muted)]">Subject</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{previewResult.daily_question_preview?.subject_name ?? 'General'}</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] p-3">
                  <p className="text-xs text-[var(--muted)]">Selected</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {previewResult.daily_question_preview?.selected_option === null
                      ? 'Not selected'
                      : `Option ${String.fromCharCode(65 + Number(previewResult.daily_question_preview?.selected_option ?? 0))}`}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <AppIcon name="questions" className="h-3.5 w-3.5" />
                  Prompt
                </div>
                <p className="mt-2 text-sm font-medium text-[var(--text)]">{previewResult.daily_question_preview?.question_text}</p>
              </div>

              <div className="space-y-2">
                {(previewResult.daily_question_preview?.options ?? []).map((option: any) => {
                  const optionIndex = Number(option.index);
                  const isCorrect = optionIndex === Number(previewResult.daily_question_preview?.correct_answer);
                  const isSelected = optionIndex === Number(previewResult.daily_question_preview?.selected_option);
                  return (
                    <div
                      key={optionIndex}
                      className={`rounded-2xl border px-4 py-3 ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                          : isSelected
                            ? 'border-red-500 bg-red-50 dark:bg-red-950'
                            : 'border-[var(--line)] bg-[var(--bg-elev)]/70'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Option {String.fromCharCode(65 + optionIndex)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text)]">{option.text}</p>
                    </div>
                  );
                })}
              </div>

              {previewResult.daily_question_preview?.explanation && (
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/18 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Explanation</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{previewResult.daily_question_preview.explanation}</p>
                </div>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
