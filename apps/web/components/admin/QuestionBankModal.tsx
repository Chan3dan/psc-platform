'use client';
import { useState } from 'react';
import { QuestionTable } from '@/components/admin/QuestionTable';

export function QuestionBankModal({ questions, total }: { questions: any[]; total: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Question Bank
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-7xl max-h-[92vh] overflow-y-auto card glass">
            <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
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
