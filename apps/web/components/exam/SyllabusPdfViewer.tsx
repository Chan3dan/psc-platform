'use client';

import { useState } from 'react';
import { PdfReader } from '@/components/notes/PdfReader';

type SyllabusPdfViewerProps = {
  title: string;
  url: string;
  proxyUrl?: string;
};

export function SyllabusPdfViewer({ title, url, proxyUrl }: SyllabusPdfViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        Open PDF
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm p-0 md:p-4 flex items-stretch md:items-center justify-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section className="w-full md:max-w-6xl h-full md:h-[92vh] bg-[var(--bg-elev)] border border-[var(--line)] md:rounded-3xl shadow-[var(--shadow-strong)] overflow-hidden flex flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--text)] truncate">{title} syllabus</h3>
                <p className="text-xs text-[var(--muted)]">Official syllabus PDF</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary px-3 py-2 text-xs shrink-0"
              >
                Close
              </button>
            </header>
            <PdfReader
              url={proxyUrl ?? url}
              title={`${title} syllabus`}
              onBack={() => setOpen(false)}
              backLabel="Back to exam"
              errorHint="The syllabus PDF may be missing, private, or uploaded with an invalid format. Re-upload it from admin exams."
            />
          </section>
        </div>
      )}
    </>
  );
}
