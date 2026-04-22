'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatResultDateTime } from '@/lib/results';

type FlaggedFilter = 'all' | 'attempts' | 'questions' | 'recent';

export function AdminFlaggedClient({ flaggedItems, isLoading = false }: { flaggedItems: any[]; isLoading?: boolean }) {
  const [filter, setFilter] = useState<FlaggedFilter>('all');

  const filteredItems = useMemo(() => {
    if (filter === 'attempts') {
      const seen = new Set<string>();
      return flaggedItems.filter((item) => {
        if (seen.has(item.resultId)) return false;
        seen.add(item.resultId);
        return true;
      });
    }
    if (filter === 'questions') {
      const seen = new Set<string>();
      return flaggedItems.filter((item) => {
        if (seen.has(item.questionId)) return false;
        seen.add(item.questionId);
        return true;
      });
    }
    if (filter === 'recent') {
      return flaggedItems.slice(0, 20);
    }
    return flaggedItems;
  }, [flaggedItems, filter]);

  const filterCards = [
    { key: 'all' as const, label: 'Flagged Items', value: flaggedItems.length, tone: 'text-amber-600' },
    { key: 'attempts' as const, label: 'Unique Attempts', value: new Set(flaggedItems.map((item) => item.resultId)).size, tone: 'text-blue-600' },
    { key: 'questions' as const, label: 'Unique Questions', value: new Set(flaggedItems.map((item) => item.questionId)).size, tone: 'text-emerald-600' },
    { key: 'recent' as const, label: 'Recent Review Window', value: 20, tone: 'text-purple-600' },
  ];

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Flagged Review Queue</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Questions users explicitly flagged during attempts, with direct paths to attempt review and question editing.</p>
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
            <h2 className="font-semibold text-[var(--text)] text-sm">Review Queue</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Open the attempt for context or jump straight into the question editor.</p>
          </div>
          <Link href="/admin/results" className="text-xs text-[var(--brand)] hover:underline">
            Open all results
          </Link>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-4 md:px-6 py-6 text-sm text-[var(--muted)]">
            {isLoading ? 'Loading flagged review queue…' : 'No flagged questions match the current filter.'}
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filteredItems.map((item) => (
              <div key={`${item.resultId}-${item.questionId}`} className="px-4 md:px-6 py-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`badge text-[10px] ${item.difficulty === 'easy' ? 'badge-green' : item.difficulty === 'medium' ? 'badge-amber' : 'badge-red'}`}>{item.difficulty}</span>
                      <span className="badge-amber">Flagged</span>
                      <span className="text-xs text-[var(--muted)]">{item.subjectName}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--text)]">{item.questionText}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {item.userName} {item.userEmail ? `(${item.userEmail})` : ''} · {item.testTitle} · {item.examName}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Attempt score {item.score}/{item.maxScore} · {formatResultDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link href={`/admin/results/${item.resultId}`} className="btn-secondary text-xs px-3 py-2">
                      View Attempt
                    </Link>
                    <Link href={`/admin/questions?open=bank&questionId=${item.questionId}&mode=edit`} className="btn-primary text-xs px-3 py-2">
                      Edit Question
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
