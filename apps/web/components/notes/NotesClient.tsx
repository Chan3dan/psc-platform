'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';

function PdfNoteViewer({ note }: { note: any }) {
  const [blobUrl, setBlobUrl] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    setStatus('loading');
    setMessage('');
    setBlobUrl('');

    async function loadPdf() {
      try {
        const response = await fetch(note.content_url, { cache: 'no-store' });
        const contentType = response.headers.get('content-type') ?? '';
        if (!response.ok || contentType.includes('application/json') || contentType.includes('text/html')) {
          const text = await response.text().catch(() => '');
          throw new Error(text || 'PDF could not be loaded.');
        }
        const blob = await response.blob();
        if (!blob.type.includes('pdf') && blob.size < 100) {
          throw new Error('The file provider returned an invalid PDF response.');
        }
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setBlobUrl(objectUrl);
          setStatus('ready');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setMessage(error instanceof Error ? error.message : 'PDF could not be loaded.');
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [note]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-300">Opening PDF inside Niyukta...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 px-5 text-white">
        <div className="max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950 text-red-300">
            <AppIcon name="alert" className="h-6 w-6" />
          </div>
          <h4 className="font-semibold">PDF could not be opened</h4>
          <p className="mt-2 text-sm text-slate-300">
            This usually means the PDF file on Cloudinary is missing, private, or saved with an older broken URL.
          </p>
          {message && (
            <p className="mt-3 rounded-xl bg-slate-950 p-3 text-left text-xs text-slate-400 line-clamp-4">
              {message}
            </p>
          )}
          <a href={note.content_url} className="btn-primary mt-4 inline-flex" download>
            Try download
          </a>
        </div>
      </div>
    );
  }

  return (
    <object data={blobUrl} type="application/pdf" className="min-h-0 flex-1 w-full bg-white">
      <iframe title={note.title} src={blobUrl} className="min-h-0 flex-1 w-full bg-white" />
      <div className="p-5 text-center">
        <p className="text-sm text-[var(--muted)]">Your browser cannot preview this PDF.</p>
        <a href={blobUrl} className="btn-primary mt-3 inline-flex" download={`${note.title}.pdf`}>
          Download PDF
        </a>
      </div>
    </object>
  );
}

// ── NOTES CLIENT ─────────────────────────────────────────────
export function NotesClient({ exams }: { exams: any[] }) {
  const [examId, setExamId] = useState(exams[0]?._id ?? '');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'pdf' | 'richtext'>('all');
  const [activeNote, setActiveNote] = useState<any | null>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', examId],
    queryFn: async () => {
      const r = await fetch(`/api/notes?exam_id=${examId}`);
      const d = await r.json();
      return d.success ? d.data : [];
    },
    enabled: !!examId,
  });

  const counts = useMemo(
    () => ({
      all: notes.length,
      pdf: notes.filter((n: any) => n.content_type === 'pdf').length,
      richtext: notes.filter((n: any) => n.content_type === 'richtext').length,
    }),
    [notes]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note: any) => {
      if (type !== 'all' && note.content_type !== type) return false;
      if (!q) return true;
      const hay =
        `${note.title ?? ''} ${note.subject_id?.name ?? ''} ${note.content_html ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, query, type]);

  return (
    <div className="space-y-5">
      <div className="card glass p-4 md:p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-[var(--text)]">Study Notes</h2>
            <p className="text-sm text-[var(--muted)] mt-0.5">Browse, filter, and quickly open your resources.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="badge badge-blue">{counts.all} total</span>
            <span className="badge badge-red">{counts.pdf} PDFs</span>
            <span className="badge badge-amber">{counts.richtext} quick notes</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'pdf', 'richtext'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors capitalize ${
                type === t
                  ? t === 'pdf'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : t === 'richtext'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t === 'richtext' ? 'Quick notes' : t} ({counts[t]})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <label className="label">Search note title or subject</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter notes..."
              className="input"
            />
          </div>
          <div>
            <label className="label">Exam</label>
            <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {exams.map(e => (
          <button key={e._id} onClick={() => setExamId(e._id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${examId === e._id ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>
            {e.name}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-400 py-4">Loading notes…</p>}

      {!isLoading && notes.length === 0 && (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <AppIcon name="notes" className="h-6 w-6" />
          </div>
          <p className="text-sm text-gray-400">No notes available for this exam yet.</p>
        </div>
      )}

      {!isLoading && notes.length > 0 && filtered.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-[var(--muted)]">No notes match your current filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((note: any) => (
          <div key={note._id} className="card p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{note.title}</h3>
                {note.subject_id?.name && (
                  <p className="text-xs text-gray-400 mt-0.5">{note.subject_id.name}</p>
                )}
              </div>
              <span className={`badge shrink-0 ${note.content_type === 'pdf' ? 'badge-red' : 'badge-blue'}`}>
                {note.content_type.toUpperCase()}
              </span>
            </div>
            {note.content_type === 'pdf' && note.content_url && (
              <button
                type="button"
                onClick={() => setActiveNote(note)}
                className="mt-3 btn-secondary text-sm w-full text-center inline-flex items-center justify-center gap-2"
              >
                <AppIcon name="notes" className="h-4 w-4" />
                View PDF
              </button>
            )}
            {note.content_type === 'richtext' && note.content_html && (
              <>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: note.content_html }} />
                <button
                  type="button"
                  onClick={() => setActiveNote(note)}
                  className="mt-3 btn-secondary text-sm w-full text-center inline-flex items-center justify-center gap-2"
                >
                  Read note
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {activeNote && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm p-0 md:p-4 flex items-stretch md:items-center justify-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveNote(null);
          }}
        >
          <section className="w-full md:max-w-5xl h-full md:h-[88vh] bg-[var(--bg-elev)] border border-[var(--line)] md:rounded-3xl shadow-[var(--shadow-strong)] overflow-hidden flex flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--text)] truncate">{activeNote.title}</h3>
                <p className="text-xs text-[var(--muted)]">{activeNote.subject_id?.name ?? 'Study resource'} · {activeNote.content_type}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNote(null)}
                className="btn-secondary px-3 py-2 text-xs shrink-0"
              >
                Close
              </button>
            </header>

            {activeNote.content_type === 'pdf' ? (
              <PdfNoteViewer note={activeNote} />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-5 text-sm leading-relaxed text-[var(--text)]">
                <div dangerouslySetInnerHTML={{ __html: activeNote.content_html ?? '' }} />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
