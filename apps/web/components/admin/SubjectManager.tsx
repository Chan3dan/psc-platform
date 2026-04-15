'use client';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const EMPTY = { name: '', slug: '', weightage_percent: 25, description: '', is_active: true };

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function SubjectManager({ exams, initialSubjects }: { exams: any[]; initialSubjects: any[] }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [editing, setEditing] = useState<any | null>(null);
  const [filterExam, setFilterExam] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const filtered = useMemo(
    () =>
      subjects.filter((s) => {
        const examId = s.exam_id?._id ?? s.exam_id;
        const byExam = !filterExam || examId === filterExam;
        const byStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' ? Boolean(s.is_active) : !Boolean(s.is_active));
        const q = query.trim().toLowerCase();
        const byQuery = !q || `${s.name ?? ''} ${s.slug ?? ''} ${s.exam_id?.name ?? ''}`.toLowerCase().includes(q);
        return byExam && byStatus && byQuery;
      }),
    [subjects, filterExam, statusFilter, query]
  );

  const activeCount = useMemo(() => subjects.filter((s: any) => s.is_active).length, [subjects]);
  const inactiveCount = useMemo(() => subjects.filter((s: any) => !s.is_active).length, [subjects]);
  const questionBankCount = useMemo(() => subjects.reduce((sum: number, s: any) => sum + (s.question_count ?? 0), 0), [subjects]);

  async function save() {
    if (!editing) return;
    setSaving(true); setError('');
    try {
      const isNew = !editing._id;
      const url = isNew ? '/api/subjects' : `/api/subjects/${editing._id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const d = await res.json();
      if (d.success) {
        setSubjects(prev => isNew ? [d.data, ...prev] : prev.map(s => s._id === d.data._id ? d.data : s));
        setEditing(null);
      } else setError(d.error);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setFilterExam('');
            setStatusFilter('all');
          }}
          className={`card p-4 text-left transition border ${statusFilter === 'all' ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-[var(--line)]'}`}
        >
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Subjects</p>
          <p className="text-2xl font-semibold text-[var(--text)] mt-1">{subjects.length}</p>
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
        <button
          onClick={() => {
            setFilterExam('');
            setQuery('');
            setStatusFilter('all');
          }}
          className="card p-4 text-left transition border border-[var(--line)] hover:border-blue-300"
        >
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Question Bank</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{questionBankCount}</p>
        </button>
      </div>

      <div className="card p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setEditing({ ...EMPTY, exam_id: exams[0]?._id ?? '' })} className="btn-primary">+ New Subject</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="input text-sm md:col-span-2"
            placeholder="Search subject by name, slug or exam..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={filterExam} onChange={e => setFilterExam(e.target.value)} className="input text-sm">
            <option value="">All exams</option>
            {exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {mounted && editing && createPortal(
        <div
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto card glass p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{editing._id ? 'Edit Subject' : 'New Subject'}</h3>
              <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-3 py-1.5">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Exam</label>
                <select value={editing.exam_id ?? ''} onChange={e => setEditing((p: any) => ({ ...p, exam_id: e.target.value }))} className="input">
                  {exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Weightage %</label>
                <input type="number" min={0} max={100} className="input" value={editing.weightage_percent ?? ''}
                  onChange={e => setEditing((p: any) => ({ ...p, weightage_percent: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Subject Name</label>
                <input className="input" value={editing.name ?? ''} placeholder="Computer Fundamentals"
                  onChange={e => setEditing((p: any) => ({ ...p, name: e.target.value, slug: p._id ? p.slug : slugify(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input font-mono text-sm" value={editing.slug ?? ''}
                  onChange={e => setEditing((p: any) => ({ ...p, slug: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input className="input" value={editing.description ?? ''}
                onChange={e => setEditing((p: any) => ({ ...p, description: e.target.value }))} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Subject'}</button>
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No subjects found.</p>}
        {filtered.map(sub => (
          <div key={sub._id} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{sub.name}</span>
                <span className="badge badge-blue">{sub.weightage_percent}%</span>
                {!sub.is_active && <span className="badge badge-gray">Inactive</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{sub.exam_id?.name} · {sub.question_count ?? 0} questions</p>
            </div>
            <button onClick={() => setEditing({ ...sub, exam_id: sub.exam_id?._id ?? sub.exam_id })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}
