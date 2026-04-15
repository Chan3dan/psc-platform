'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const DIFF: Record<string, string> = {
  easy: 'badge-green',
  medium: 'badge-amber',
  hard: 'badge-red',
};

interface EditState {
  _id: string;
  question_text: string;
  options: Array<{ index: number; text: string }>;
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  year: string;
  tags: string;
}

export function QuestionTable({
  questions,
  focusQuestionId,
  autoEdit = false,
}: {
  questions: any[];
  focusQuestionId?: string;
  autoEdit?: boolean;
}) {
  const [rows, setRows] = useState<any[]>(questions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [autoFocused, setAutoFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const examOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((q) => {
      const id = q.exam_id?._id?.toString?.() ?? '';
      const name = q.exam_id?.name ?? '';
      if (id && name && !map.has(id)) map.set(id, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const subjectOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    rows.forEach((q) => {
      const examId = q.exam_id?._id?.toString?.() ?? '';
      if (examFilter && examId !== examFilter) return;
      const subjectName = String(q.subject_id?.name ?? '').trim();
      const subjectKey = subjectName.toLowerCase();
      if (subjectKey && !map.has(subjectKey)) {
        map.set(subjectKey, { id: subjectKey, name: subjectName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, examFilter]);

  const filtered = useMemo(
    () =>
      rows.filter((q) => {
        const matchesSearch = !search || (() => {
          const s = search.toLowerCase();
          return (
          q.question_text.toLowerCase().includes(s) ||
          q.subject_id?.name?.toLowerCase().includes(s) ||
          q.exam_id?.name?.toLowerCase().includes(s)
          );
        })();
        const matchesExam = !examFilter || q.exam_id?._id?.toString?.() === examFilter;
        const rowSubjectName = String(q.subject_id?.name ?? '').trim().toLowerCase();
        const matchesSubject = !subjectFilter || rowSubjectName === subjectFilter;
        const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
        return matchesSearch && matchesExam && matchesSubject && matchesDifficulty;
      }),
    [rows, search, examFilter, subjectFilter, difficultyFilter]
  );

  const baseFiltered = useMemo(
    () =>
      rows.filter((q) => {
        const matchesSearch = !search || (() => {
          const s = search.toLowerCase();
          return (
            q.question_text.toLowerCase().includes(s) ||
            q.subject_id?.name?.toLowerCase().includes(s) ||
            q.exam_id?.name?.toLowerCase().includes(s)
          );
        })();
        const matchesExam = !examFilter || q.exam_id?._id?.toString?.() === examFilter;
        const rowSubjectName = String(q.subject_id?.name ?? '').trim().toLowerCase();
        const matchesSubject = !subjectFilter || rowSubjectName === subjectFilter;
        return matchesSearch && matchesExam && matchesSubject;
      }),
    [rows, search, examFilter, subjectFilter]
  );

  const difficultyCounts = useMemo(() => {
    return {
      all: baseFiltered.length,
      easy: baseFiltered.filter((q) => q.difficulty === 'easy').length,
      medium: baseFiltered.filter((q) => q.difficulty === 'medium').length,
      hard: baseFiltered.filter((q) => q.difficulty === 'hard').length,
    };
  }, [baseFiltered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!focusQuestionId || autoFocused) return;
    const targetIndex = filtered.findIndex((q) => q._id === focusQuestionId);
    if (targetIndex === -1) return;
    const nextPage = Math.floor(targetIndex / pageSize) + 1;
    if (page !== nextPage) {
      setPage(nextPage);
      return;
    }
    const target = filtered[targetIndex];
    setExpanded(target._id);
    if (autoEdit) startEdit(target);
    setAutoFocused(true);
  }, [focusQuestionId, autoEdit, autoFocused, filtered, pageSize, page]);

  function startEdit(q: any) {
    setError('');
    setEditing({
      _id: q._id,
      question_text: q.question_text ?? '',
      options: Array.isArray(q.options) ? q.options.map((o: any) => ({ index: o.index, text: o.text ?? '' })) : [
        { index: 0, text: '' },
        { index: 1, text: '' },
        { index: 2, text: '' },
        { index: 3, text: '' },
      ],
      correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
      explanation: q.explanation ?? '',
      difficulty: (q.difficulty ?? 'medium') as 'easy' | 'medium' | 'hard',
      year: q.year ? String(q.year) : '',
      tags: Array.isArray(q.tags) ? q.tags.join(', ') : '',
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        question_text: editing.question_text.trim(),
        options: editing.options.map((o) => ({ index: o.index, text: o.text.trim() })),
        correct_answer: editing.correct_answer,
        explanation: editing.explanation.trim(),
        difficulty: editing.difficulty,
        year: editing.year ? Number(editing.year) : undefined,
        tags: editing.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch(`/api/questions/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? 'Failed to update question');
        return;
      }

      setRows((prev) => prev.map((q) => (q._id === editing._id ? data.data : q)));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="px-4 md:px-6 py-3 border-b border-[var(--line)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Search question / subject / exam..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input text-sm"
          />
          <select
            className="input text-sm"
            value={examFilter}
            onChange={(e) => {
              setExamFilter(e.target.value);
              setSubjectFilter('');
              setPage(1);
            }}
          >
            <option value="">All Exams</option>
            {examOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select className="input text-sm" value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}>
            <option value="">All Subjects</option>
            {subjectOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select className="input text-sm" value={difficultyFilter} onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}>
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
          <button
            className={`card p-2 text-left transition border ${difficultyFilter === '' ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-[var(--line)]'}`}
            onClick={() => { setDifficultyFilter(''); setPage(1); }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">All</p>
            <p className="text-sm font-semibold text-[var(--text)]">{difficultyCounts.all}</p>
          </button>
          <button
            className={`card p-2 text-left transition border ${difficultyFilter === 'easy' ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'border-[var(--line)]'}`}
            onClick={() => { setDifficultyFilter('easy'); setPage(1); }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Easy</p>
            <p className="text-sm font-semibold text-emerald-600">{difficultyCounts.easy}</p>
          </button>
          <button
            className={`card p-2 text-left transition border ${difficultyFilter === 'medium' ? 'border-amber-400 ring-2 ring-amber-200 dark:ring-amber-900' : 'border-[var(--line)]'}`}
            onClick={() => { setDifficultyFilter('medium'); setPage(1); }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Medium</p>
            <p className="text-sm font-semibold text-amber-600">{difficultyCounts.medium}</p>
          </button>
          <button
            className={`card p-2 text-left transition border ${difficultyFilter === 'hard' ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-900' : 'border-[var(--line)]'}`}
            onClick={() => { setDifficultyFilter('hard'); setPage(1); }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Hard</p>
            <p className="text-sm font-semibold text-red-600">{difficultyCounts.hard}</p>
          </button>
        </div>
      </div>

      {mounted && editing && createPortal(
        <div
          className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-0 md:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div className="w-full max-w-5xl max-h-[100dvh] md:max-h-[92vh] overflow-y-auto overscroll-contain card glass rounded-none md:rounded-2xl p-4 md:p-5 pb-24 md:pb-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--text)]">Edit Question</h3>
              <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-3 py-1.5">Close</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Question Text</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={editing.question_text}
                  onChange={(e) => setEditing((p) => (p ? { ...p, question_text: e.target.value } : p))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editing.options.map((opt, i) => (
                  <div key={opt.index}>
                    <label className="label">Option {String.fromCharCode(65 + i)}</label>
                    <input
                      className="input"
                      value={opt.text}
                      onChange={(e) =>
                        setEditing((p) =>
                          p
                            ? {
                                ...p,
                                options: p.options.map((o) => (o.index === opt.index ? { ...o, text: e.target.value } : o)),
                              }
                            : p
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="label">Correct Answer</label>
                  <select
                    className="input"
                    value={editing.correct_answer}
                    onChange={(e) => setEditing((p) => (p ? { ...p, correct_answer: Number(e.target.value) } : p))}
                  >
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select
                    className="input"
                    value={editing.difficulty}
                    onChange={(e) => setEditing((p) => (p ? { ...p, difficulty: e.target.value as any } : p))}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input
                    className="input"
                    type="number"
                    value={editing.year}
                    onChange={(e) => setEditing((p) => (p ? { ...p, year: e.target.value } : p))}
                  />
                </div>
                <div>
                  <label className="label">Tags (comma)</label>
                  <input
                    className="input"
                    value={editing.tags}
                    onChange={(e) => setEditing((p) => (p ? { ...p, tags: e.target.value } : p))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Explanation</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={editing.explanation}
                  onChange={(e) => setEditing((p) => (p ? { ...p, explanation: e.target.value } : p))}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(null)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="divide-y divide-[var(--line)]">
        {filtered.length === 0 && <p className="text-center text-[var(--muted)] text-sm py-8">No questions found.</p>}
        {paged.map((q) => {
          const open = expanded === q._id;
          return (
            <div key={q._id}>
              <button
                className="w-full text-left px-4 md:px-6 py-3 hover:bg-[var(--brand-soft)]/35 transition-colors"
                onClick={() => setExpanded(open ? null : q._id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`badge text-[10px] shrink-0 ${DIFF[q.difficulty] ?? 'badge-gray'}`}>{q.difficulty}</span>
                      <span className="text-[11px] text-[var(--muted)]">{q.exam_id?.name}</span>
                      <span className="text-[var(--muted)] text-[11px]">•</span>
                      <span className="text-[11px] text-[var(--muted)]">{q.subject_id?.name}</span>
                    </div>
                    <p className="text-sm text-[var(--text)] leading-relaxed md:truncate">{q.question_text}</p>
                  </div>
                  <span className="text-[var(--muted)] text-xs shrink-0 pt-1">{open ? '▲' : '▼'}</span>
                </div>
              </button>

              {open && (
                <div className="px-4 md:px-6 pb-4 bg-[var(--brand-soft)]/20 space-y-2">
                  <div className="mt-2 space-y-1">
                    {q.options?.map((o: any) => (
                      <p
                        key={o.index}
                        className={`text-sm ${
                          o.index === q.correct_answer
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-[var(--muted)]'
                        }`}
                      >
                        {o.index === q.correct_answer ? 'Correct: ' : ''}
                        {String.fromCharCode(65 + o.index)}. {o.text}
                      </p>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-[var(--muted)] italic border-t border-[var(--line)] pt-2 mt-2">{q.explanation}</p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-xs text-[var(--muted)]">{q.year ? `Year: ${q.year}` : 'Year: N/A'}</p>
                    <button onClick={() => startEdit(q)} className="text-sm text-[var(--brand)] font-semibold self-start sm:self-auto">
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length > 0 && (
        <div className="px-4 md:px-6 py-3 border-t border-[var(--line)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-[var(--muted)]">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="input text-xs py-1.5 px-2 w-[88px]"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={20}>20/page</option>
              <option value={50}>50/page</option>
              <option value={100}>100/page</option>
            </select>
            <button className="btn-secondary py-1.5 px-3 text-xs" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span className="text-xs text-[var(--muted)] self-center">Page {page} / {totalPages}</span>
            <button className="btn-secondary py-1.5 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
