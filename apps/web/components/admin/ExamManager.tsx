'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const EMPTY = {
  name: '', slug: '', description: '',
  duration_minutes: 45, total_questions: 50,
  total_marks: 50, negative_marking: 20,
  passing_marks: 20, is_active: true,
  syllabus_outline: '',
  syllabus_pdf_url: '',
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function normalizePercent(value: number) {
  return value <= 1 ? value * 100 : value;
}

export function ExamManager({ initialExams }: { initialExams: any[] }) {
  const [exams, setExams] = useState(initialExams);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  async function save() {
    if (!editing) return;
    setSaving(true); setError('');
    try {
      const isNew = !editing._id;
      const res = await fetch(isNew ? '/api/exams' : `/api/exams/${editing.slug}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const d = await res.json();
      if (d.success) {
        setExams(prev => isNew ? [d.data, ...prev] : prev.map(e => e._id === d.data._id ? d.data : e));
        setEditing(null);
      } else setError(d.error);
    } finally { setSaving(false); }
  }

  const fields = [
    { key: 'duration_minutes', label: 'Duration (min)', type: 'number' },
    { key: 'total_questions', label: 'Total Questions', type: 'number' },
    { key: 'total_marks', label: 'Total Marks', type: 'number' },
    { key: 'passing_marks', label: 'Passing Marks', type: 'number' },
    { key: 'negative_marking', label: 'Negative Marking (%)', type: 'number', step: '0.1' },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exams.filter((exam) => {
      const statusOk = statusFilter === 'all' || (statusFilter === 'active' ? exam.is_active : !exam.is_active);
      const queryOk =
        !q ||
        `${exam.name ?? ''} ${exam.slug ?? ''} ${exam.description ?? ''}`.toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [exams, query, statusFilter]);

  const activeCount = exams.filter((e) => e.is_active).length;
  const inactiveCount = Math.max(0, exams.length - activeCount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => setEditing(EMPTY)} className="btn-primary">+ New Exam</button>
        <div className="w-full md:w-auto md:min-w-[320px]">
          <input
            className="input text-sm"
            placeholder="Search exam by name, slug or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`card p-4 text-left transition border ${statusFilter === 'all' ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-[var(--line)]'}`}
        >
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">All Exams</p>
          <p className="text-2xl font-semibold text-[var(--text)] mt-1">{exams.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`card p-4 text-left transition border ${statusFilter === 'active' ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'border-[var(--line)]'}`}
        >
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Active</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{activeCount}</p>
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`card p-4 text-left transition border ${statusFilter === 'inactive' ? 'border-amber-400 ring-2 ring-amber-200 dark:ring-amber-900' : 'border-[var(--line)]'}`}
        >
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Inactive</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{inactiveCount}</p>
        </button>
      </div>

      {mounted && editing && createPortal(
        <div
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto card glass p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{editing._id ? 'Edit Exam' : 'New Exam'}</h3>
              <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-3 py-1.5">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editing.name ?? ''} placeholder="Computer Operator"
                  onChange={e => setEditing((p: any) => ({ ...p, name: e.target.value, slug: p._id ? p.slug : slugify(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input font-mono text-sm" value={editing.slug ?? ''} placeholder="computer-operator"
                  onChange={e => setEditing((p: any) => ({ ...p, slug: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={editing.description ?? ''}
                onChange={e => setEditing((p: any) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Syllabus Outline</label>
                <textarea
                  className="input resize-none"
                  rows={4}
                  placeholder="Add chapter-wise syllabus guidance used by planner..."
                  value={editing.syllabus_outline ?? ''}
                  onChange={e => setEditing((p: any) => ({ ...p, syllabus_outline: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Syllabus PDF URL (Optional)</label>
                <input
                  className="input"
                  placeholder="https://.../syllabus.pdf"
                  value={editing.syllabus_pdf_url ?? ''}
                  onChange={e => setEditing((p: any) => ({ ...p, syllabus_pdf_url: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input className="input" type={f.type} step={(f as any).step}
                    value={(editing as any)[f.key] ?? ''}
                    onChange={e => setEditing((p: any) => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))} />
                </div>
              ))}
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="active" checked={editing.is_active ?? true}
                  onChange={e => setEditing((p: any) => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Example: if each question carries 2 marks and negative marking is 20%, each wrong answer deducts 0.4 marks.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Exam'}</button>
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No exams found for current filters.</p>}
        {filtered.map(exam => {
          const marksPerQuestion = exam.total_questions ? exam.total_marks / exam.total_questions : 1;
          const negativePercent = exam.negative_marking <= 1 ? exam.negative_marking * 100 : exam.negative_marking;
          const negativePerWrong = (marksPerQuestion * negativePercent) / 100;

          return (
            <div key={exam._id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{exam.name}</h3>
                  {!exam.is_active && <span className="badge badge-gray">Inactive</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {exam.duration_minutes}min · {exam.total_questions}q · {exam.total_marks}pts · −{negativePercent}% ({negativePerWrong.toFixed(2)} / wrong)
                </p>
                {(exam.syllabus_outline || exam.syllabus_pdf_url) && (
                  <p className="text-[11px] text-emerald-600 mt-1">Syllabus linked</p>
                )}
              </div>
              <button
                onClick={() => setEditing({ ...exam, negative_marking: normalizePercent(exam.negative_marking ?? 20) })}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
