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
    <div className="w-full">
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary inline-flex items-center gap-2 text-sm">
        Open PDF
      </button>

      {open && (
        <section className="mt-4 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] shadow-[var(--shadow-strong)]">
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
          <div className="h-[70vh] md:h-[82vh]">
            <PdfReader
              url={proxyUrl ?? url}
              title={`${title} syllabus`}
              onBack={() => setOpen(false)}
              backLabel="Back to exam"
              errorHint="The syllabus PDF may be missing, private, or uploaded with an invalid format. Re-upload it from admin exams."
            />
          </div>
        </section>
      )}
    </div>
  );
}
