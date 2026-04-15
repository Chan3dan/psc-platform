'use client';
import { useState } from 'react';
import { QuestionTable } from '@/components/admin/QuestionTable';

export function QuestionBankModal({ questions, total }: { questions: any[]; total: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-secondary w-full sm:w-auto" onClick={() => setOpen(true)}>
        Question Bank
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-7xl h-[100dvh] md:h-auto md:max-h-[92vh] overflow-y-auto card glass rounded-none md:rounded-2xl">
            <div className="px-4 md:px-6 py-4 border-b border-[var(--line)] flex items-start md:items-center justify-between gap-3 sticky top-0 bg-[color:color-mix(in_oklab,var(--bg-elev)_90%,transparent_10%)] backdrop-blur-md z-10">
              <div>
                <h3 className="font-semibold text-[var(--text)]">Question Bank</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">Loaded {questions.length} / Total {total}</p>
              </div>
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <QuestionTable questions={questions} />
          </div>
        </div>
      )}
    </>
  );
}
