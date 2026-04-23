'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';

type ReviewFilter = 'all' | 'wrong' | 'skipped' | 'flagged';

export function ReviewQueueClient() {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['review-queue'],
    queryFn: async () => {
      const response = await fetch('/api/review/queue');
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error ?? 'Could not load review queue');
      return payload.data;
    },
    staleTime: 45_000,
  });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (filter === 'all') return items;
    return items.filter((item: any) => item.reason === filter || (filter === 'flagged' && item.flagged));
  }, [data, filter]);

  const counts = data?.counts ?? { all: 0, wrong: 0, skipped: 0, flagged: 0 };

  return (
    <div className="page-wrap space-y-6">
      <section className="card glass p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
              <AppIcon name="bookmarks" className="h-3.5 w-3.5" />
              Smart Review Queue
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[var(--text)]">Fix your score leaks</h1>
            <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl">
              This queue is built from your recent wrong, skipped, and flagged questions. Review these first before starting another mock.
            </p>
          </div>
          <Link href="/practice" className="btn-primary inline-flex items-center gap-2">
            Practice by Subject
            <AppIcon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ['all', 'Total', counts.all, 'text-blue-600'],
          ['wrong', 'Wrong', counts.wrong, 'text-red-600'],
          ['skipped', 'Skipped', counts.skipped, 'text-amber-600'],
          ['flagged', 'Flagged', counts.flagged, 'text-indigo-600'],
        ] as const).map(([key, label, value, tone]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`card p-4 text-left ${filter === key ? 'border-[var(--brand)] ring-2 ring-[color:color-mix(in_oklab,var(--brand)_24%,transparent)]' : ''}`}
          >
            <p className={`text-2xl font-bold ${tone}`}>{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
          </button>
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Questions to Review</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Open a card, understand the explanation, then practice that subject again.</p>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-[var(--muted)]">Loading your review queue...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
              <AppIcon name="check" className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-[var(--text)]">No review items here</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Complete more practice or mock tests to build a smarter review queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filtered.map((item: any) => {
              const question = item.question;
              const open = openId === item.id;
              return (
                <article key={item.id} className="p-4 md:p-5">
                  <button className="w-full text-left" onClick={() => setOpenId(open ? null : item.id)}>
                    <div className="flex items-start gap-3">
                      <span className={`badge shrink-0 ${item.reason === 'wrong' ? 'badge-red' : item.reason === 'skipped' ? 'badge-amber' : 'badge-blue'}`}>
                        {item.reason}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2">{question.question_text}</h3>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {question.subject_name} · {question.difficulty} · {new Date(item.attempted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--muted)]">{open ? 'Hide' : 'Review'}</span>
                    </div>
                  </button>

                  {open && (
                    <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/20 p-4 space-y-2">
                      {question.options.map((option: any) => {
                        const isCorrect = option.index === question.correct_answer;
                        const isSelected = option.index === item.selected_option;
                        return (
                          <p
                            key={option.index}
                            className={`text-sm ${isCorrect ? 'font-semibold text-emerald-600' : isSelected ? 'text-red-500 line-through' : 'text-[var(--muted)]'}`}
                          >
                            {isCorrect ? 'Correct: ' : isSelected ? 'Selected: ' : ''}
                            {String.fromCharCode(65 + option.index)}. {option.text}
                          </p>
                        );
                      })}
                      <p className="pt-2 text-xs text-[var(--muted)]">
                        Your answer: <span className="font-semibold text-[var(--text)]">{item.selected_option === null ? 'Not answered' : String.fromCharCode(65 + item.selected_option)}</span>
                      </p>
                      {question.explanation && (
                        <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          <strong>Explanation: </strong>{question.explanation}
                        </div>
                      )}
                      {question.practice_href && (
                        <Link href={question.practice_href} className="btn-secondary mt-3 inline-flex text-sm">
                          Practice this subject
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
