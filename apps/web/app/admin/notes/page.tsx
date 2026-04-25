'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';
import { PdfReader } from '@/components/notes/PdfReader';

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
  const [editing, setEditing] = useState<typeof emptyForm | null>(null);
  const [previewNote, setPreviewNote] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [editSubjects, setEditSubjects] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editMsg, setEditMsg] = useState('');

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
    setMounted(true);
  }, []);

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

  useEffect(() => {
    async function loadEditSubjects() {
      if (!editing?.examId) {
        setEditSubjects([]);
        return;
      }
      const r = await fetch(`/api/subjects?exam_id=${editing.examId}`);
      const d = await r.json();
      setEditSubjects(d.success ? d.data : []);
    }
    loadEditSubjects();
  }, [editing?.examId]);

  function resetForm(examId = filterExamId) {
    setForm({ ...emptyForm, examId });
    setMsg('');
  }

  function editNote(note: any) {
    setEditing({
      id: String(note._id),
      examId: noteExamId(note),
      subjectId: noteSubjectId(note),
      title: String(note.title ?? ''),
      type: note.content_type === 'richtext' ? 'richtext' : 'pdf',
      html: String(note.content_html ?? ''),
      file: null,
      isActive: Boolean(note.is_active),
    });
    setEditMsg('Upload a new PDF only if you want to replace the current file.');
  }

  async function saveDraft(draft: typeof emptyForm, mode: 'create' | 'edit') {
    if (!draft.examId || !draft.title.trim()) {
      return { success: false, error: 'Exam and title are required.' };
    }
    if (mode === 'create' && draft.type === 'pdf' && !draft.file) {
      return { success: false, error: 'Choose a PDF file for new PDF notes.' };
    }
    if (draft.type === 'richtext' && !draft.html.trim()) {
      return { success: false, error: 'Rich text content is required.' };
    }

    const fd = new FormData();
    fd.append('exam_id', draft.examId);
    fd.append('subject_id', draft.subjectId);
    fd.append('title', draft.title.trim());
    fd.append('content_type', draft.type);
    fd.append('content_html', draft.type === 'richtext' ? draft.html : '');
    fd.append('is_active', String(draft.isActive));
    if (draft.file) fd.append('file', draft.file);

    const res = await fetch(mode === 'edit' ? `/api/notes/${draft.id}` : '/api/notes', {
      method: mode === 'edit' ? 'PATCH' : 'POST',
      body: fd,
    });
    return readJson(res);
  }

  async function saveNote() {
    setSaving(true);
    setMsg('');
    try {
      const d = await saveDraft(form, 'create');
      if (!d.success) {
        setMsg(`Error: ${d.error ?? 'Failed to save note.'}`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      resetForm(form.examId);
      setMsg('Note created successfully.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setEditSaving(true);
    setEditMsg('');
    try {
      const d = await saveDraft(editing, 'edit');
      if (!d.success) {
        setEditMsg(`Error: ${d.error ?? 'Failed to update note.'}`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditing(null);
      setMsg('Note updated successfully.');
    } finally {
      setEditSaving(false);
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
    if (editing?.id === note._id) setEditing(null);
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
            <h2 className="font-semibold text-[var(--text)]">Create note</h2>
            <p className="text-xs text-[var(--muted)] mt-1">Use the note list to edit or replace existing PDFs in a modal.</p>
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
              <label className="label">PDF file</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))}
                className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
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
            <p className={`rounded-xl px-3 py-2 text-sm ${msg.startsWith('Error:') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {msg}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={saveNote} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create note'}
            </button>
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
                <article key={note._id} className={`rounded-2xl border p-4 ${note.is_active ? 'border-[var(--line)] bg-[var(--bg-elev)]/92' : 'border-amber-200 bg-amber-50/70'}`}>
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
                        <button
                          type="button"
                          onClick={() => setPreviewNote(note)}
                          className="btn-secondary text-center text-xs"
                        >
                          Test PDF
                        </button>
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

      {mounted && editing && createPortal(
        <div
          className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div className="flex h-full w-full flex-col overflow-hidden border border-[var(--line)] bg-[var(--bg-elev)] shadow-2xl md:h-auto md:max-h-[92vh] md:max-w-3xl md:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">Edit Note</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">Repair metadata, visibility, rich text, or replace a broken PDF.</p>
              </div>
              <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-3 py-1.5">Close</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Exam</label>
                  <select
                    value={editing.examId}
                    onChange={(e) => setEditing((p) => p ? { ...p, examId: e.target.value, subjectId: '' } : p)}
                    className="input"
                  >
                    <option value="">Select exam</option>
                    {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select
                    value={editing.subjectId}
                    onChange={(e) => setEditing((p) => p ? { ...p, subjectId: e.target.value } : p)}
                    className="input"
                    disabled={!editSubjects.length}
                  >
                    <option value="">All subjects</option>
                    {editSubjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  value={editing.title}
                  onChange={(e) => setEditing((p) => p ? { ...p, title: e.target.value } : p)}
                />
              </div>

              <div>
                <label className="label">Content type</label>
                <div className="flex flex-wrap gap-2">
                  {(['pdf', 'richtext'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditing((p) => p ? { ...p, type } : p)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${editing.type === type ? 'bg-blue-600 text-white' : 'btn-secondary'}`}
                    >
                      {type === 'pdf' ? 'PDF' : 'Rich text'}
                    </button>
                  ))}
                </div>
              </div>

              {editing.type === 'pdf' ? (
                <div>
                  <label className="label">Replace PDF file</label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setEditing((p) => p ? { ...p, file: e.target.files?.[0] ?? null } : p)}
                    className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-soft)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--brand)] hover:file:opacity-90"
                  />
                  <p className="mt-2 text-xs text-[var(--muted)]">Leave empty to keep the current PDF. Upload a new file to repair broken notes.</p>
                </div>
              ) : (
                <div>
                  <label className="label">HTML content</label>
                  <textarea
                    className="input min-h-56 font-mono text-xs"
                    value={editing.html}
                    onChange={(e) => setEditing((p) => p ? { ...p, html: e.target.value } : p)}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing((p) => p ? { ...p, isActive: e.target.checked } : p)}
                />
                Active and visible to users
              </label>

              {editMsg && (
                <p className={`rounded-xl px-3 py-2 text-sm ${editMsg.startsWith('Error:') ? 'bg-red-50 text-red-600' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}>
                  {editMsg}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] p-4 sm:flex-row sm:justify-end">
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={editSaving} className="btn-primary disabled:opacity-50">
                {editSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && previewNote && createPortal(
        <div
          className="fixed inset-0 z-[140] bg-slate-950/85 backdrop-blur-sm p-0 md:p-4 flex items-stretch md:items-center justify-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewNote(null);
          }}
        >
          <section className="w-full md:max-w-6xl h-full md:h-[92vh] bg-[var(--bg-elev)] border border-[var(--line)] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--text)] truncate">Test PDF: {previewNote.title}</h3>
                <p className="text-xs text-[var(--muted)]">
                  {previewNote.exam_id?.name ?? 'Exam'} · {previewNote.subject_id?.name ?? 'All subjects'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewNote(null)}
                className="btn-secondary px-3 py-2 text-xs shrink-0"
              >
                Close
              </button>
            </header>
            <PdfReader
              url={`/api/notes/${previewNote._id}/file`}
              title={previewNote.title}
              onBack={() => setPreviewNote(null)}
            />
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
