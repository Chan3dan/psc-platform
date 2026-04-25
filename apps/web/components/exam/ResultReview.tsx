'use client';
import { useState } from 'react';
import { AppIcon } from '@/components/icons/AppIcon';

type Filter = 'all' | 'correct' | 'wrong' | 'skipped' | 'flagged';

export function ResultReview({ answers }: { answers: any[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = {
    all: answers.length,
    correct: answers.filter(a => a.is_correct).length,
    wrong: answers.filter(a => !a.is_correct && a.selected_option !== null).length,
    skipped: answers.filter(a => a.selected_option === null).length,
    flagged: answers.filter(a => a.flagged).length,
  };

  const filtered = answers.filter(a => {
    if (filter === 'correct') return a.is_correct;
    if (filter === 'wrong') return !a.is_correct && a.selected_option !== null;
    if (filter === 'skipped') return a.selected_option === null;
    if (filter === 'flagged') return a.flagged;
    return true;
  });

  const borderColor = (a: any) =>
    a.is_correct ? 'border-l-emerald-400' : a.selected_option === null ? 'border-l-[var(--line)]' : 'border-l-red-400';

  const scorePct = counts.all > 0 ? Math.round((counts.correct / counts.all) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
        <div className="card p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Flagged</p>
          <p className="text-xl font-semibold text-blue-600 mt-1">{counts.flagged}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-1 flex-wrap">
        {(['all', 'correct', 'wrong', 'skipped', 'flagged'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
              ${filter === f
                ? f === 'wrong' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                : f === 'correct' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : f === 'flagged' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-[var(--bg)] text-[var(--muted)] hover:bg-[var(--brand-soft)]/35'
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
              <button className="w-full text-left p-4 hover:bg-[var(--brand-soft)]/25 transition-colors cursor-pointer" onClick={() => setExpanded(open ? null : q._id)}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                    ${a.is_correct ? 'bg-emerald-100 text-emerald-700' : a.selected_option === null ? 'bg-[var(--bg)] text-[var(--muted)]' : 'bg-red-100 text-red-600'}`}>
                    {a.is_correct ? <AppIcon name="check" className="h-3 w-3" /> : a.selected_option === null ? '—' : <AppIcon name="alert" className="h-3 w-3" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] line-clamp-2">{q.question_text}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                      <span>{q.subject_id?.name}</span>
                      <span>·</span>
                      <span className="capitalize">{q.difficulty ?? 'mixed'}</span>
                      {a.flagged && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600 dark:text-amber-400">Flagged for review</span>
                        </>
                      )}
                      <span>·</span>
                      <span className={a.marks_awarded > 0 ? 'text-emerald-600' : a.marks_awarded < 0 ? 'text-red-500' : 'text-[var(--muted)]'}>
                        {a.marks_awarded > 0 ? '+' : ''}{a.marks_awarded} marks
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[var(--muted)] text-xs block">{open ? 'Hide' : 'Review'}</span>
                    <span className="text-[var(--muted)] text-xs">{open ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>
              {open && (
                <div className="px-4 pb-4 border-t border-[var(--line)] pt-3 space-y-2">
                  {q.options.map((opt: any) => {
                    let cls = 'text-[var(--muted)]';
                    let prefix = '';
                    if (opt.index === q.correct_answer) { cls = 'text-emerald-600 font-medium'; prefix = 'Correct: '; }
                    if (opt.index === a.selected_option && opt.index !== q.correct_answer) { cls = 'text-red-500 line-through'; prefix = 'Selected: '; }
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
                    <div className="rounded-lg border border-[var(--line)] bg-[var(--brand-soft)]/35 p-3 text-xs text-[var(--text)] mt-2">
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
