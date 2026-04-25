'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const STATUSES = ['all', 'new', 'reviewing', 'planned', 'resolved', 'closed'] as const;
const CATEGORIES = ['all', 'general', 'feature', 'bug', 'exam_request'] as const;

export function AdminFeedbackPageClient() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [nextStatus, setNextStatus] = useState('new');

  const feedbackQuery = useQuery({
    queryKey: ['admin-feedback', status, category, query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (category !== 'all') params.set('category', category);
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error ?? 'Could not load feedback');
      return payload.data as any[];
    },
  });

  const selected = useMemo(
    () => feedbackQuery.data?.find((item) => item._id === selectedId) ?? feedbackQuery.data?.[0] ?? null,
    [feedbackQuery.data, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected._id);
    setAdminNote(selected.admin_note ?? '');
    setNextStatus(selected.status ?? 'new');
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return null;
      const response = await fetch(`/api/admin/feedback/${selected._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          admin_note: adminNote,
        }),
      });
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error ?? 'Could not save feedback');
      return payload.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });

  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Feedback Inbox</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Review bug reports, feature ideas, and exam requests coming from the public site and the app.
        </p>
      </div>

      <section className="card p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr,0.8fr,0.8fr]">
          <input
            className="input"
            placeholder="Search by name, email, exam, or message..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value as any)}>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All statuses' : item}
              </option>
            ))}
          </select>
          <select className="input" value={category} onChange={(event) => setCategory(event.target.value as any)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All categories' : item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <section className="card overflow-hidden">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">Requests</h2>
          </div>
          <div className="max-h-[68vh] overflow-y-auto divide-y divide-[var(--line)]">
            {feedbackQuery.isLoading ? (
              <p className="px-4 py-8 text-sm text-[var(--muted)]">Loading feedback...</p>
            ) : feedbackQuery.data?.length ? (
              feedbackQuery.data.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  onClick={() => {
                    setSelectedId(item._id);
                    setAdminNote(item.admin_note ?? '');
                    setNextStatus(item.status ?? 'new');
                  }}
                  className={`block w-full px-4 py-4 text-left transition-colors ${
                    selected?._id === item._id ? 'bg-[var(--brand-soft)]/45' : 'hover:bg-[var(--brand-soft)]/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text)]">{item.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{item.email}</p>
                    </div>
                    <span className="badge-gray capitalize">{item.status}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">{item.category.replace('_', ' ')}</p>
                  {item.exam_name ? <p className="mt-1 text-xs text-[var(--muted)]">Requested exam: {item.exam_name}</p> : null}
                  <p className="mt-2 text-sm text-[var(--muted)] line-clamp-3">{item.message}</p>
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-sm text-[var(--muted)]">No feedback matched your filters.</p>
            )}
          </div>
        </section>

        <section className="card p-5">
          {selected ? (
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-blue capitalize">{selected.category.replace('_', ' ')}</span>
                  <span className="badge-gray capitalize">{selected.status}</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-[var(--text)]">{selected.name}</h2>
                <p className="text-sm text-[var(--muted)]">{selected.email}</p>
                {selected.exam_name ? (
                  <p className="mt-2 text-sm text-[var(--brand)]">Exam request: {selected.exam_name}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
                <p className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-wrap">{selected.message}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-[0.8fr,1.2fr]">
                <select className="input" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                  {STATUSES.filter((item) => item !== 'all').map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Short admin note..."
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                />
              </div>

              {saveMutation.isError ? (
                <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
                  {(saveMutation.error as Error).message}
                </p>
              ) : null}

              <div className="flex justify-end">
                <button type="button" onClick={() => saveMutation.mutate()} className="btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save update'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Select a feedback item to review it.</p>
          )}
        </section>
      </div>
    </div>
  );
}
