'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';

interface Props {
  initialPlan: any | null;
  exams: Array<{ _id: string; name: string; slug: string }>;
  initialExamId?: string;
}

const PLANNER_QUOTES = [
  'A plan is only real when your activity proves it.',
  'Protect today’s study block like an exam hall seat.',
  'Weak topics become easy when they appear on the calendar.',
];

export function PlannerClient({ initialPlan, exams, initialExamId }: Props) {
  const [plan, setPlan] = useState(initialPlan);
  const [creating, setCreating] = useState(!initialPlan);
  const [form, setForm] = useState({
    exam_id: initialExamId ?? exams[0]?._id ?? '',
    target_date: '',
    daily_hours: 2,
    preferences: {
      strategy: 'balanced' as 'balanced' | 'weak-first' | 'intensive',
      include_mock_days: true,
      weekend_boost: false,
      preferred_session_minutes: 45,
    },
  });
  const [selDay, setSelDay] = useState(0);
  const initialSyncDone = useRef(false);

  const generate = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      return d.data;
    },
    onSuccess: (d) => {
      initialSyncDone.current = false;
      setPlan(d);
      setCreating(false);
      setSelDay(0);
    },
  });

  const syncProgress = useMutation({
    mutationFn: async ({ dayIndex }: { dayIndex?: number } = {}) => {
      const r = await fetch(`/api/planner/${plan._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeof dayIndex === 'number' ? { day_index: dayIndex } : {}),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      return d.data;
    },
    onSuccess: (d) => setPlan(d),
  });

  useEffect(() => {
    if (!plan?._id || creating || initialSyncDone.current) return;
    initialSyncDone.current = true;
    syncProgress.mutate({});
  }, [creating, plan?._id, syncProgress]);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);

  if (creating) {
    return (
      <div className="max-w-xl space-y-5">
        <div className="card glass p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-[var(--text)]">Generate Your Study Plan</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Create a personalized day-by-day roadmap based on your target exam.</p>
          </div>

          <div>
            <label className="label">Target Exam</label>
            <select
              value={form.exam_id}
              onChange={(e) => setForm((f) => ({ ...f, exam_id: e.target.value }))}
              className="input"
            >
              {exams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Exam Date</label>
            <input
              type="date"
              min={minDate.toISOString().split('T')[0]}
              value={form.target_date}
              onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Daily Study Hours: <strong>{form.daily_hours}h</strong>
            </label>
            <input
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={form.daily_hours}
              onChange={(e) => setForm((f) => ({ ...f, daily_hours: parseFloat(e.target.value) }))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
              <span>1h</span>
              <span>4h</span>
              <span>8h</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Planning Strategy</label>
              <select
                value={form.preferences.strategy}
                onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, strategy: e.target.value as any } }))}
                className="input"
              >
                <option value="balanced">Balanced</option>
                <option value="weak-first">Weak-first</option>
                <option value="intensive">Intensive</option>
              </select>
            </div>
            <div>
              <label className="label">Preferred Session (min)</label>
              <input
                type="number"
                min={25}
                max={120}
                value={form.preferences.preferred_session_minutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    preferences: {
                      ...f.preferences,
                      preferred_session_minutes: Math.min(120, Math.max(25, Number(e.target.value) || 45)),
                    },
                  }))
                }
                className="input"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={form.preferences.include_mock_days}
                onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, include_mock_days: e.target.checked } }))}
                className="w-4 h-4 accent-blue-600"
              />
              Include weekly mock day
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                type="checkbox"
                checked={form.preferences.weekend_boost}
                onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, weekend_boost: e.target.checked } }))}
                className="w-4 h-4 accent-blue-600"
              />
              Weekend study boost
            </label>
          </div>

          {generate.isError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {(generate.error as Error).message}
            </p>
          )}

          <button
            onClick={() => generate.mutate()}
            disabled={!form.exam_id || !form.target_date || generate.isPending}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {generate.isPending ? 'Generating...' : 'Generate Study Plan'}
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] text-center">Planner uses subject weights, your strategy, and weak-topic performance.</p>
      </div>
    );
  }

  if (!plan) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((new Date(plan.target_date).getTime() - today.getTime()) / 86400000));
  const done = plan.daily_schedule?.filter((d: any) => d.is_completed).length ?? 0;
  const total = plan.daily_schedule?.length ?? 0;
  const day = plan.daily_schedule?.[selDay];
  const overdueDays = (plan.daily_schedule ?? []).filter((item: any) => {
    const date = new Date(item.date);
    date.setHours(0, 0, 0, 0);
    return date < today && !item.is_completed;
  }).length;
  const complianceScore = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalVerifiedQuestions = (plan.daily_schedule ?? []).reduce(
    (sum: number, item: any) => sum + Number(item.verified_question_count ?? 0),
    0
  );
  const totalVerifiedMinutes = (plan.daily_schedule ?? []).reduce(
    (sum: number, item: any) => sum + Number(item.verified_minutes ?? 0),
    0
  );
  const currentDayProgress = day?.tasks?.length
    ? Math.round((day.tasks.filter((task: any) => task.is_completed).length / day.tasks.length) * 100)
    : 0;
  const todayIndex = Math.max(
    0,
    (plan.daily_schedule ?? []).findIndex((item: any) => {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    })
  );
  const todayPlan = (plan.daily_schedule ?? [])[todayIndex] ?? day;
  const nextTask = todayPlan?.tasks?.find((task: any) => !task.is_completed) ?? todayPlan?.tasks?.[0] ?? null;
  const plannerQuote = PLANNER_QUOTES[new Date().getDate() % PLANNER_QUOTES.length];

  return (
    <div className="space-y-6">
      <div className="card glass p-5 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
              <AppIcon name="planner" className="h-3.5 w-3.5" />
              Strict study planning
            </div>
            <h2 className="mt-3 font-semibold text-[var(--text)] text-xl">{plan.title}</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              {plan.exam_id?.name} · Target: {new Date(plan.target_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
              <span className="badge-amber inline-flex items-center gap-1.5">
                <AppIcon name="leaderboard" className="h-4 w-4" />
                {plan.streak_days} day streak
              </span>
              <span className="badge-gray inline-flex items-center gap-1.5">
                <AppIcon name="planner" className="h-4 w-4" />
                {daysLeft} days left
              </span>
              <span className={`${overdueDays > 0 ? 'badge-red' : 'badge-green'} inline-flex items-center gap-1.5`}>
                <AppIcon name={overdueDays > 0 ? 'alert' : 'check'} className="h-4 w-4" />
                {overdueDays > 0 ? `${overdueDays} overdue day${overdueDays > 1 ? 's' : ''}` : 'On track'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => syncProgress.mutate({})}
              disabled={syncProgress.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {syncProgress.isPending ? 'Checking…' : 'Run strict check'}
            </button>
            <button
              onClick={() => {
                setPlan(null);
                setCreating(true);
              }}
              className="btn-secondary"
            >
              New plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Verified days</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{done}/{total}</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Compliance</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{complianceScore}%</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Verified questions</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600">{totalVerifiedQuestions}</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Verified hours</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{(totalVerifiedMinutes / 60).toFixed(1)}h</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/18 p-4 text-sm text-[var(--muted)]">
          This planner no longer trusts manual checkmarks. Tasks auto-complete only after real solved questions, revision activity, or a verified mock attempt matches the day’s workload.
        </div>
      </div>

      <div className="card overflow-hidden border border-[var(--brand)]/25">
        <div className="grid gap-0 lg:grid-cols-[0.8fr,1.2fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_42%),linear-gradient(145deg,var(--brand-soft),transparent)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">Today’s boost</p>
            <h3 className="mt-2 text-xl font-bold text-[var(--text)]">
              {todayPlan?.is_completed ? 'Today is verified' : 'Finish one verified action'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{plannerQuote}</p>
          </div>
          <div className="p-5">
            {nextTask ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{nextTask.subject_name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {nextTask.task_type} · {nextTask.duration_minutes}min
                    {nextTask.question_count > 0 ? ` · ${nextTask.question_count} questions` : ''}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Auto-completes after real activity: {nextTask.task_type === 'mock' ? `${nextTask.minimum_minutes ?? 0}+ mock minutes` : `${nextTask.minimum_questions ?? nextTask.question_count ?? 0}+ questions`}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelDay(todayIndex >= 0 ? todayIndex : selDay);
                      syncProgress.mutate({ dayIndex: todayIndex >= 0 ? todayIndex : selDay });
                    }}
                    disabled={syncProgress.isPending}
                    className="btn-primary text-xs"
                  >
                    {syncProgress.isPending ? 'Checking...' : 'Verify today'}
                  </button>
                  <Link href={nextTask.task_type === 'mock' ? '/mock' : '/exams'} className="btn-secondary text-xs">
                    Start activity
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-[var(--muted)]">No pending task for today. Keep the streak alive with a short drill or review queue.</p>
                <Link href="/drill" className="btn-primary text-xs">Start speed drill</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-[var(--muted)] mb-1.5">
          <span>Progress</span>
          <span>
            {done}/{total} days
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]/65">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? Math.round((done / total) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="card p-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {plan.daily_schedule?.slice(0, 45).map((d: any, i: number) => {
            const dt = new Date(d.date);
            dt.setHours(0, 0, 0, 0);
            const isToday = dt.toDateString() === today.toDateString();
            const isPast = dt < today;

            return (
              <button
                key={i}
                onClick={() => setSelDay(i)}
                className={`flex-shrink-0 w-14 py-2 rounded-xl text-center transition-colors
                  ${selDay === i
                    ? 'bg-blue-600 text-white'
                    : d.is_completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : isPast
                    ? 'bg-red-50 text-red-500'
                    : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]'}
                  ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              >
                <div className="text-[10px] font-medium">{dt.toLocaleDateString('en', { weekday: 'short' })}</div>
                <div className="text-sm font-semibold">{dt.getDate()}</div>
                {d.is_completed && (
                  <div className="flex justify-center text-emerald-500">
                    <AppIcon name="check" className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {day && (
        <div className="card p-5 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-[var(--text)]">
                Day {day.day} — {new Date(day.date).toLocaleDateString('en-NP', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {day.total_minutes}min planned · {Number(day.verified_question_count ?? 0)} questions verified · {Number(day.verified_minutes ?? 0)} minutes verified
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`${day.is_completed ? 'badge-green' : 'badge-gray'} inline-flex items-center gap-1.5`}>
                <AppIcon name={day.is_completed ? 'check' : 'alert'} className="h-3.5 w-3.5" />
                {day.is_completed ? 'Verified complete' : `${currentDayProgress}% verified`}
              </span>
              <button
                onClick={() => syncProgress.mutate({ dayIndex: selDay })}
                disabled={syncProgress.isPending}
                className="btn-secondary text-xs"
              >
                {syncProgress.isPending ? 'Checking…' : 'Verify this day'}
              </button>
            </div>
          </div>
          {day.tasks.map((task: any, ti: number) => (
            <div
              key={ti}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                task.is_completed ? 'bg-emerald-50' : 'bg-[var(--brand-soft)]/20'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                  ${task.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[var(--line)] text-transparent'}`}
              >
                {task.is_completed && <AppIcon name="check" className="h-3 w-3" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'}`}>
                  {task.subject_name}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)} · {task.duration_minutes}min
                  {task.question_count > 0 && ` · ${task.question_count}q`}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Strict checkpoint:
                  {' '}
                  {task.task_type === 'mock'
                    ? `${task.minimum_minutes ?? 0}+ verified minutes in one mock`
                    : `${task.minimum_questions ?? task.question_count ?? 0}+ real questions in this subject`}
                  {' · '}
                  Progress:
                  {' '}
                  {Number(task.verified_questions ?? 0)}q / {Number(task.verified_minutes ?? 0)}min
                </p>
              </div>
              <span className={`badge text-xs ${task.task_type === 'mock' ? 'badge-red' : task.task_type === 'revision' ? 'badge-amber' : 'badge-blue'}`}>
                {task.task_type}
              </span>
            </div>
          ))}
          {syncProgress.isError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {(syncProgress.error as Error).message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
