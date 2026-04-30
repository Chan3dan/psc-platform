'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = {
  examDate?: string | Date | null;
  topicsRemaining: number;
  readinessPercent: number;
};

function getRemaining(target?: string | Date | null) {
  if (!target) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const total = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}

function message(days: number, readiness: number) {
  if (readiness >= 80) return 'You are building exam confidence. Keep the routine steady.';
  if (days <= 7) return 'Final week: revise mistakes, protect sleep, and avoid random new topics.';
  if (days <= 21) return 'This is the scoring window. Practice daily and revise on schedule.';
  return 'Plenty of runway. Consistency now makes the final week calmer.';
}

export function ExamCountdown({ examDate, topicsRemaining, readinessPercent }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(examDate));

  useEffect(() => {
    setRemaining(getRemaining(examDate));
    const id = window.setInterval(() => setRemaining(getRemaining(examDate)), 1000);
    return () => window.clearInterval(id);
  }, [examDate]);

  const units = useMemo(
    () => [
      ['Days', remaining.days],
      ['Hours', remaining.hours],
      ['Minutes', remaining.minutes],
      ['Seconds', remaining.seconds],
    ],
    [remaining]
  );

  return (
    <section className="card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr,1.25fr]">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.24),transparent_42%),linear-gradient(145deg,var(--brand-soft),transparent)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Exam countdown</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--text)]">
            {examDate ? `${remaining.days} days left` : 'Set your exam date'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {message(remaining.days, readinessPercent)}
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {units.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Readiness</p>
              <p className="mt-2 text-2xl font-bold text-emerald-500">{readinessPercent}%</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Topics remaining</p>
              <p className="mt-2 text-2xl font-bold text-[var(--brand)]">{topicsRemaining}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
