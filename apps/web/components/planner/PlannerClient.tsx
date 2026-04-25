'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';

interface Props {
  initialPlan: any | null;
  exams: Array<{ _id: string; name: string; slug: string }>;
  initialExamId?: string;
}

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
      setPlan(d);
      setCreating(false);
      setSelDay(0);
    },
  });

  const complete = useMutation({
    mutationFn: async ({ di, ti }: { di: number; ti: number }) => {
      const r = await fetch(`/api/planner/${plan._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_index: di, task_index: ti }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      return d.data;
    },
    onSuccess: (d) => setPlan(d),
  });

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
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">
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

  return (
    <div className="space-y-6">
      <div className="card glass p-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-[var(--text)]">{plan.title}</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {plan.exam_id?.name} · Target: {new Date(plan.target_date).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-orange-500 font-semibold">
              <AppIcon name="leaderboard" className="h-4 w-4" />
              {plan.streak_days} day streak
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
              <AppIcon name="planner" className="h-4 w-4" />
              {daysLeft} days left
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setPlan(null);
            setCreating(true);
          }}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
        >
          New plan
        </button>
      </div>

      <div>
        <div className="flex justify-between text-xs text-[var(--muted)] mb-1.5">
          <span>Progress</span>
          <span>
            {done}/{total} days
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
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
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : isPast
                    ? 'bg-red-50 dark:bg-red-950 text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text)]">
              Day {day.day} — {new Date(day.date).toLocaleDateString('en-NP', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <span className="text-xs text-[var(--muted)]">{day.total_minutes}min total</span>
          </div>
          {day.tasks.map((task: any, ti: number) => (
            <div
              key={ti}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                task.is_completed ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-[var(--brand-soft)]/20'
              }`}
            >
              <button
                onClick={() => complete.mutate({ di: selDay, ti })}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                  ${task.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'}`}
              >
                {task.is_completed && <AppIcon name="check" className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'}`}>
                  {task.subject_name}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)} · {task.duration_minutes}min
                  {task.question_count > 0 && ` · ${task.question_count}q`}
                </p>
              </div>
              <span className={`badge text-xs ${task.task_type === 'mock' ? 'badge-red' : task.task_type === 'revision' ? 'badge-amber' : 'badge-blue'}`}>
                {task.task_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
