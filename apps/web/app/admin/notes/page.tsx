'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';

type ContentType = 'pdf' | 'richtext';

const emptyForm = {
  id: '',
  examId: '',
  subjectId: '',
  title: '',
  type: 'pdf' as ContentType,
  html: '',
  file: null as File | null,
  isActive: true,
};

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return { success: false, error: `Empty response (${res.status})` };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: text.slice(0, 180) || `Invalid response (${res.status})` };
  }
}

function noteExamId(note: any) {
  return String(note.exam_id?._id ?? note.exam_id ?? '');
}

function noteSubjectId(note: any) {
  return String(note.subject_id?._id ?? note.subject_id ?? '');
}

export default function AdminNotesPage() {
  const queryClient = useQueryClient();
  const [filterExamId, setFilterExamId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const { data: exams = [] } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: async () => {
      const r = await fetch('/api/exams');
      const d = await r.json();
      return d.data ?? [];
    },
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['admin-notes', filterExamId],
    queryFn: async () => {
      const qs = new URLSearchParams({ admin: '1' });
      if (filterExamId) qs.set('exam_id', filterExamId);
      const r = await fetch(`/api/notes?${qs.toString()}`);
      const d = await r.json();
      return d.data ?? [];
    },
  });

  const counts = useMemo(
    () => ({
      all: notes.length,
      pdf: notes.filter((n: any) => n.content_type === 'pdf').length,
      richtext: notes.filter((n: any) => n.content_type === 'richtext').length,
      inactive: notes.filter((n: any) => !n.is_active).length,
    }),
    [notes]
  );

  useEffect(() => {
    async function loadSubjects() {
      if (!form.examId) {
        setSubjects([]);
        return;
      }
      const r = await fetch(`/api/subjects?exam_id=${form.examId}`);
      const d = await r.json();
      setSubjects(d.success ? d.data : []);
    }
    loadSubjects();
  }, [form.examId]);

  function resetForm(examId = filterExamId) {
    setForm({ ...emptyForm, examId });
    setMsg('');
  }

  function editNote(note: any) {
    setForm({
      id: String(note._id),
      examId: noteExamId(note),
      subjectId: noteSubjectId(note),
      title: String(note.title ?? ''),
      type: note.content_type === 'richtext' ? 'richtext' : 'pdf',
      html: String(note.content_html ?? ''),
      file: null,
      isActive: Boolean(note.is_active),
    });
    setMsg('Editing note. Upload a new PDF only if you want to replace the current file.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveNote() {
    if (!form.examId || !form.title.trim()) {
      setMsg('Error: Exam and title are required.');
      return;
    }
    if (!form.id && form.type === 'pdf' && !form.file) {
      setMsg('Error: Choose a PDF file for new PDF notes.');
      return;
    }
    if (form.type === 'richtext' && !form.html.trim()) {
      setMsg('Error: Rich text content is required.');
      return;
    }

    setSaving(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('exam_id', form.examId);
      fd.append('subject_id', form.subjectId);
      fd.append('title', form.title.trim());
      fd.append('content_type', form.type);
      fd.append('content_html', form.type === 'richtext' ? form.html : '');
      fd.append('is_active', String(form.isActive));
      if (form.file) fd.append('file', form.file);

      const res = await fetch(form.id ? `/api/notes/${form.id}` : '/api/notes', {
        method: form.id ? 'PATCH' : 'POST',
        body: fd,
      });
      const d = await readJson(res);
      if (!d.success) {
        setMsg(`Error: ${d.error ?? 'Failed to save note.'}`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      resetForm(form.examId);
      setMsg(form.id ? 'Note updated successfully.' : 'Note created successfully.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleNote(note: any) {
    const fd = new FormData();
    fd.append('is_active', String(!note.is_active));
    const res = await fetch(`/api/notes/${note._id}`, { method: 'PATCH', body: fd });
    const d = await readJson(res);
    if (!d.success) {
      setMsg(`Error: ${d.error ?? 'Failed to update note.'}`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
    await queryClient.invalidateQueries({ queryKey: ['notes'] });
  }

  async function deleteNote(note: any) {
    if (!window.confirm(`Delete "${note.title}" permanently?`)) return;
    const res = await fetch(`/api/notes/${note._id}`, { method: 'DELETE' });
    const d = await readJson(res);
    if (!d.success) {
      setMsg(`Error: ${d.error ?? 'Failed to delete note.'}`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
    await queryClient.invalidateQueries({ queryKey: ['notes'] });
    if (form.id === note._id) resetForm();
  }

  return (
    <div className="page-wrap max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Notes Management</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Create, repair, replace, deactivate, and delete study notes.</p>
        </div>
        <button onClick={() => resetForm()} className="btn-secondary text-sm">
          New note
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4"><p className="text-xs text-[var(--muted)]">Total</p><p className="mt-1 text-2xl font-semibold">{counts.all}</p></div>
        <div className="card p-4"><p className="text-xs text-[var(--muted)]">PDF</p><p className="mt-1 text-2xl font-semibold">{counts.pdf}</p></div>
        <div className="card p-4"><p className="text-xs text-[var(--muted)]">Rich text</p><p className="mt-1 text-2xl font-semibold">{counts.richtext}</p></div>
        <div className="card p-4"><p className="text-xs text-[var(--muted)]">Inactive</p><p className="mt-1 text-2xl font-semibold">{counts.inactive}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] gap-5">
        <div className="card glass p-5 space-y-5 h-fit">
          <div>
            <h2 className="font-semibold text-[var(--text)]">{form.id ? 'Edit note' : 'Create note'}</h2>
            <p className="text-xs text-[var(--muted)] mt-1">Replacing a PDF creates a fresh Cloudinary file and repairs broken links.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Exam</label>
              <select value={form.examId} onChange={(e) => setForm((p) => ({ ...p, examId: e.target.value, subjectId: '' }))} className="input">
                <option value="">Select exam</option>
                {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject</label>
              <select value={form.subjectId} onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))} className="input" disabled={!subjects.length}>
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Computer Fundamentals Notes" />
          </div>

          <div>
            <label className="label">Content type</label>
            <div className="flex flex-wrap gap-2">
              {(['pdf', 'richtext'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type }))}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${form.type === type ? 'bg-blue-600 text-white' : 'btn-secondary'}`}
                >
                  {type === 'pdf' ? 'PDF' : 'Rich text'}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'pdf' ? (
            <div>
              <label className="label">{form.id ? 'Replace PDF file' : 'PDF file'}</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))}
                className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
              {form.id && <p className="mt-2 text-xs text-[var(--muted)]">Leave empty to keep the current PDF.</p>}
            </div>
          ) : (
            <div>
              <label className="label">HTML content</label>
              <textarea className="input min-h-48 font-mono text-xs" value={form.html} onChange={(e) => setForm((p) => ({ ...p, html: e.target.value }))} />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            Active and visible to users
          </label>

          {msg && (
            <p className={`rounded-xl px-3 py-2 text-sm ${msg.startsWith('Error:') ? 'bg-red-50 text-red-600 dark:bg-red-950' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
              {msg}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={saveNote} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : form.id ? 'Save changes' : 'Create note'}
            </button>
            {form.id && <button onClick={() => resetForm()} className="btn-secondary">Cancel</button>}
          </div>
        </div>

        <div className="card p-5 space-y-4 min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--text)]">Existing notes</h2>
              <p className="text-xs text-[var(--muted)]">Use Replace PDF for any note that fails in the user viewer.</p>
            </div>
            <select value={filterExamId} onChange={(e) => setFilterExamId(e.target.value)} className="input sm:max-w-64">
              <option value="">All exams</option>
              {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-[var(--muted)]">Loading notes...</p>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center">
              <AppIcon name="notes" className="mx-auto h-8 w-8 text-[var(--muted)]" />
              <p className="mt-3 text-sm text-[var(--muted)]">No notes found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {notes.map((note: any) => (
                <article key={note._id} className={`rounded-2xl border p-4 ${note.is_active ? 'border-[var(--line)] bg-white/70 dark:bg-slate-900/70' : 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30'}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${note.content_type === 'pdf' ? 'badge-red' : 'badge-blue'}`}>{String(note.content_type).toUpperCase()}</span>
                        <span className={`badge ${note.is_active ? 'badge-green' : 'badge-amber'}`}>{note.is_active ? 'Active' : 'Hidden'}</span>
                      </div>
                      <h3 className="mt-2 truncate font-semibold text-[var(--text)]">{note.title}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {note.exam_id?.name ?? 'Exam'} · {note.subject_id?.name ?? 'All subjects'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                      <button onClick={() => editNote(note)} className="btn-secondary text-xs">Edit</button>
                      <button onClick={() => toggleNote(note)} className="btn-secondary text-xs">{note.is_active ? 'Hide' : 'Show'}</button>
                      {note.content_type === 'pdf' && (
                        <a href={`/api/notes/${note._id}/file`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-center text-xs">
                          Test PDF
                        </a>
                      )}
                      <button onClick={() => deleteNote(note)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
