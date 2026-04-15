'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function AdminNotesPage() {
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState('');
  const [type, setType] = useState<'pdf' | 'richtext'>('pdf');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const { data: exams = [] } = useQuery({
    queryKey: ['admin-exams'],
    queryFn: async () => { const r = await fetch('/api/exams'); const d = await r.json(); return d.data ?? []; },
  });

  async function loadSubjects(eid: string) {
    setExamId(eid);
    const r = await fetch(`/api/subjects?exam_id=${eid}`);
    const d = await r.json();
    if (d.success) { setSubjects(d.data); setSubjectId(d.data[0]?._id ?? ''); }
  }

  async function upload() {
    if (!examId || !title) { setMsg('Exam and title required'); return; }
    setUploading(true); setMsg('');
    const fd = new FormData();
    fd.append('exam_id', examId);
    if (subjectId) fd.append('subject_id', subjectId);
    fd.append('title', title);
    if (type === 'pdf' && file) fd.append('file', file);
    if (type === 'richtext') fd.append('content_html', html);
    const r = await fetch('/api/notes', { method: 'POST', body: fd });
    const d = await r.json();
    setMsg(d.success ? '✓ Note uploaded successfully' : `Error: ${d.error}`);
    if (d.success) { setTitle(''); setFile(null); setHtml(''); }
    setUploading(false);
  }

  return (
    <div className="page-wrap max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Notes</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Upload PDF or rich-text study notes by exam and subject.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card glass p-5 lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Exam</label>
              <select value={examId} onChange={e => loadSubjects(e.target.value)} className="input">
                <option value="">Select exam</option>
                {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject (optional)</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="input" disabled={!subjects.length}>
                <option value="">All subjects</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Note Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Computer Fundamentals — Complete Notes" />
          </div>

          <div>
            <label className="label">Content Type</label>
            <div className="flex gap-3">
              {(['pdf', 'richtext'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === t ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>
                  {t === 'pdf' ? 'PDF Upload' : 'Rich Text'}
                </button>
              ))}
            </div>
          </div>

          {type === 'pdf' && (
            <div>
              <label className="label">PDF File</label>
              <input type="file" accept=".pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          )}

          {type === 'richtext' && (
            <div>
              <label className="label">Content (HTML)</label>
              <textarea className="input font-mono text-xs resize-none" rows={10} value={html}
                onChange={e => setHtml(e.target.value)} placeholder="<h2>Introduction</h2><p>Content here…</p>" />
            </div>
          )}

          {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith('✓') ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950 text-red-600'}`}>{msg}</p>}

          <button onClick={upload} disabled={uploading || !examId || !title} className="btn-primary w-full disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Upload Note'}
          </button>
        </div>

        <div className="card p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-[var(--text)]">Upload Tips</h2>
          <ul className="text-xs text-[var(--muted)] space-y-2 list-disc pl-4">
            <li>Choose the exact exam first so notes appear in the right dashboard section.</li>
            <li>Use subject-specific notes for targeted revision and planner recommendations.</li>
            <li>For rich text, keep semantic HTML (`h2`, `p`, `ul`) for cleaner rendering.</li>
            <li>Short, descriptive titles help users discover notes faster.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
