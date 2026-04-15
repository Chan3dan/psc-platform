'use client';
import { useState } from 'react';

type Filter = 'all' | 'correct' | 'wrong' | 'skipped';

export function ResultReview({ answers }: { answers: any[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = {
    all: answers.length,
    correct: answers.filter(a => a.is_correct).length,
    wrong: answers.filter(a => !a.is_correct && a.selected_option !== null).length,
    skipped: answers.filter(a => a.selected_option === null).length,
  };

  const filtered = answers.filter(a => {
    if (filter === 'correct') return a.is_correct;
    if (filter === 'wrong') return !a.is_correct && a.selected_option !== null;
    if (filter === 'skipped') return a.selected_option === null;
    return true;
  });

  const borderColor = (a: any) =>
    a.is_correct ? 'border-l-emerald-400' : a.selected_option === null ? 'border-l-gray-300 dark:border-l-gray-600' : 'border-l-red-400';

  const scorePct = counts.all > 0 ? Math.round((counts.correct / counts.all) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Accuracy</p>
          <p className="text-xl font-semibold text-[var(--text)] mt-1">{scorePct}%</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Correct</p>
          <p className="text-xl font-semibold text-emerald-600 mt-1">{counts.correct}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Wrong</p>
          <p className="text-xl font-semibold text-red-600 mt-1">{counts.wrong}</p>
        </div>
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Skipped</p>
          <p className="text-xl font-semibold text-amber-600 mt-1">{counts.skipped}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-1 flex-wrap">
        {(['all', 'correct', 'wrong', 'skipped'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
              ${filter === f
                ? f === 'wrong' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                : f === 'correct' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(a => {
          const q = a.question_id;
          if (!q) return null;
          const open = expanded === q._id;
          return (
            <div key={q._id} className={`card border-l-4 ${borderColor(a)}`}>
              <button className="w-full text-left p-4" onClick={() => setExpanded(open ? null : q._id)}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                    ${a.is_correct ? 'bg-emerald-100 text-emerald-700' : a.selected_option === null ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-red-100 text-red-600'}`}>
                    {a.is_correct ? '✓' : a.selected_option === null ? '—' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{q.subject_id?.name}</span>
                      <span>·</span>
                      <span className="capitalize">{q.difficulty ?? 'mixed'}</span>
                      <span>·</span>
                      <span className={a.marks_awarded > 0 ? 'text-emerald-600' : a.marks_awarded < 0 ? 'text-red-500' : 'text-gray-400'}>
                        {a.marks_awarded > 0 ? '+' : ''}{a.marks_awarded} marks
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs shrink-0">{open ? '▲' : '▼'}</span>
                </div>
              </button>
              {open && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                  {q.options.map((opt: any) => {
                    let cls = 'text-gray-600 dark:text-gray-400';
                    let prefix = '';
                    if (opt.index === q.correct_answer) { cls = 'text-emerald-700 dark:text-emerald-400 font-medium'; prefix = '✓ '; }
                    if (opt.index === a.selected_option && opt.index !== q.correct_answer) { cls = 'text-red-600 dark:text-red-400 line-through'; prefix = '✗ '; }
                    return (
                      <p key={opt.index} className={`text-sm ${cls}`}>
                        {prefix}{String.fromCharCode(65 + opt.index)}. {opt.text}
                      </p>
                    );
                  })}
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Your answer:{' '}
                    <span className="font-medium text-[var(--text)]">
                      {a.selected_option === null ? 'Not answered' : String.fromCharCode(65 + a.selected_option)}
                    </span>
                    {' · '}
                    Correct:{' '}
                    <span className="font-medium text-emerald-600">
                      {String.fromCharCode(65 + q.correct_answer)}
                    </span>
                  </div>
                  {q.explanation && (
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200 mt-2">
                      <strong>Explanation: </strong>{q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
