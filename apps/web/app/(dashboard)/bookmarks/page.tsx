'use client';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';

export default function BookmarksPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const { startSession, reset } = useExamStore();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const r = await fetch('/api/bookmarks');
      const d = await r.json();
      return d.success ? d.data : [];
    },
  });

  const remove = useMutation({
    mutationFn: async (questionId: string) => {
      await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const saveNote = useMutation({
    mutationFn: async ({ bookmarkId, note }: { bookmarkId: string; note: string }) => {
      const r = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error ?? 'Failed to save note');
      return d.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const subjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const bm of bookmarks as any[]) {
      const sid = bm?.question_id?.subject_id?._id;
      const sname = bm?.question_id?.subject_id?.name;
      if (!sid || !sname) continue;
      const prev = map.get(String(sid));
      if (prev) prev.count += 1;
      else map.set(String(sid), { id: String(sid), name: String(sname), count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (subjectFilter === 'all') return bookmarks as any[];
    return (bookmarks as any[]).filter((bm) => String(bm?.question_id?.subject_id?._id) === subjectFilter);
  }, [bookmarks, subjectFilter]);

  const startPractice = useMutation({
    mutationFn: async () => {
      const ids = filteredBookmarks
        .map((bm: any) => bm?.question_id?._id)
        .filter(Boolean);
      if (ids.length === 0) throw new Error('No bookmarked questions available for this filter.');

      const firstExam = filteredBookmarks[0]?.question_id?.exam_id?._id ?? null;
      const r = await fetch('/api/tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: 'practice',
          exam_id: firstExam,
          question_ids: ids,
          count: Math.min(ids.length, 50),
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error ?? 'Failed to start bookmark practice');
      return d.data;
    },
    onSuccess: (data) => {
      reset();
      startSession(data);
      router.push('/practice/bookmarks');
    },
  });

  const emptyState = !isLoading && bookmarks.length === 0;

  return (
    <div className="page-wrap max-w-6xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Bookmarks</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{bookmarks.length} saved questions</p>
        </div>
        <button
          onClick={() => startPractice.mutate()}
          disabled={startPractice.isPending || filteredBookmarks.length === 0}
          className="btn-primary disabled:opacity-50"
        >
          {startPractice.isPending ? 'Starting…' : 'Practice from Bookmarks'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-[var(--muted)] py-4">Loading…</p>}

      {emptyState && (
        <div className="card p-10 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-[var(--brand-soft)]/50 flex items-center justify-center text-3xl">🔖</div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">No bookmarks yet</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Bookmark questions during practice and they will appear here.</p>
        </div>
      )}

      {!emptyState && (
        <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-4">
          <aside className="card p-4 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">Subjects</p>
            <div className="space-y-1.5">
              <button
                onClick={() => setSubjectFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${subjectFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-[var(--text)]'}`}
              >
                All Subjects ({bookmarks.length})
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectFilter(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${subjectFilter === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-[var(--text)]'}`}
                >
                  {s.name} ({s.count})
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-2">
            {filteredBookmarks.map((bm: any) => {
              const q = bm.question_id;
              if (!q) return null;
              const open = expanded === bm._id;
              const noteValue = noteDrafts[bm._id] ?? bm.note ?? '';
              return (
                <div key={bm._id} className="card">
                  <button className="w-full text-left p-4" onClick={() => setExpanded(open ? null : bm._id)}>
                    <div className="flex items-start gap-3">
                      <span className="text-amber-400 shrink-0">🔖</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text)] line-clamp-2">{q.question_text}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                          <span>{q.subject_id?.name}</span>
                          <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-amber' : 'badge-red'}`}>{q.difficulty}</span>
                        </div>
                      </div>
                      <span className="text-[var(--muted)] text-xs shrink-0">{open ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t border-[var(--line)] pt-3 space-y-3">
                      {q.options.map((opt: any) => (
                        <p
                          key={opt.index}
                          className={`text-sm ${opt.index === q.correct_answer ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-[var(--muted)]'}`}
                        >
                          {opt.index === q.correct_answer ? '✓ ' : ''}{String.fromCharCode(65 + opt.index)}. {opt.text}
                        </p>
                      ))}

                      {q.explanation && (
                        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}

                      <div>
                        <label className="label">Personal note</label>
                        <textarea
                          rows={3}
                          className="input resize-none"
                          value={noteValue}
                          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [bm._id]: e.target.value }))}
                          placeholder="Add your note for revision..."
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => saveNote.mutate({ bookmarkId: bm._id, note: noteValue })}
                            className="btn-primary text-sm"
                          >
                            Save Note
                          </button>
                          <button
                            onClick={() => remove.mutate(q._id)}
                            className="btn-secondary text-sm text-red-600"
                          >
                            Remove Bookmark
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
