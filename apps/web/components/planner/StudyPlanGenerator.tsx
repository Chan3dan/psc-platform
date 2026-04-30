'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type ExamOption = { _id: string; name: string; slug: string };
type SubjectOption = { _id: string; name: string; slug: string; weightage_percent?: number };

type Props = {
  exams: ExamOption[];
  subjectsByExam: Record<string, SubjectOption[]>;
  initialExamId?: string;
  initialPlan?: any | null;
  onPlanGenerated?: (plan: any) => void;
};

type GeneratorForm = {
  exam_id: string;
  examDate: string;
  dailyHours: number;
  weakTopicSlugs: string[];
  preferences: {
    strategy: 'balanced' | 'weak-first' | 'intensive';
    include_mock_days: boolean;
    weekend_boost: boolean;
    preferred_session_minutes: number;
  };
};

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' });
}

function getWeeks(schedule: any[]) {
  const weeks: any[][] = [];
  for (let index = 0; index < schedule.length; index += 7) {
    weeks.push(schedule.slice(index, index + 7));
  }
  return weeks.slice(0, 6);
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayProgress(day: any) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task: any) => task.is_completed).length / tasks.length) * 100);
}

function taskLabel(task: any) {
  if (task.task_type === 'notes') return 'Study notes';
  if (task.task_type === 'mock') return 'Take mock';
  if (task.task_type === 'revision') return 'Revise MCQs';
  return 'Practice MCQs';
}

function cleanSubjectSlug(task: any) {
  return String(task.subject_slug ?? '')
    .replace(/-notes$/, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function getTaskHref(task: any, examSlug: string) {
  if (task.task_type === 'notes' || task.verification_mode === 'notes') return '/notes';
  if (task.task_type === 'mock' || task.verification_mode === 'mock') return '/mock';
  const subjectSlug = cleanSubjectSlug(task);
  return examSlug && subjectSlug ? `/practice/${examSlug}/${subjectSlug}` : '/practice';
}

export function StudyPlanGenerator({
  exams,
  subjectsByExam,
  initialExamId,
  initialPlan,
  onPlanGenerated,
}: Props) {
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState(initialPlan);
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [form, setForm] = useState<GeneratorForm>({
    exam_id: initialExamId ?? exams[0]?._id ?? '',
    examDate: '',
    dailyHours: 2,
    weakTopicSlugs: [],
    preferences: {
      strategy: 'balanced',
      include_mock_days: true,
      weekend_boost: false,
      preferred_session_minutes: 45,
    },
  });

  const subjects = subjectsByExam[form.exam_id] ?? [];
  const selectedExam =
    exams.find((exam) => exam._id === form.exam_id) ??
    exams.find((exam) => exam._id === String(plan?.exam_id?._id ?? plan?.exam_id));
  const examSlug = String(plan?.exam_id?.slug ?? selectedExam?.slug ?? '');
  const minDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }, []);

  const generate = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Could not generate the study plan.');
      return data.data;
    },
    onSuccess: (newPlan) => {
      setPlan(newPlan);
      onPlanGenerated?.(newPlan);
      queryClient.invalidateQueries({ queryKey: ['planner', 'today'] });
    },
  });

  function toggleWeakTopic(slug: string) {
    setForm((current) => ({
      ...current,
      weakTopicSlugs: current.weakTopicSlugs.includes(slug)
        ? current.weakTopicSlugs.filter((item) => item !== slug)
        : [...current.weakTopicSlugs, slug],
    }));
  }

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Smart planner</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--text)]">Generate a syllabus-weighted plan</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pick your exam date, daily hours, and weak topics. The calendar gives heavier subjects more space.
          </p>
        </div>
        {plan && (
          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
            {plan.daily_schedule?.length ?? 0} days planned
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <label className="block">
          <span className="label">Target exam</span>
          <select
            className="input"
            value={form.exam_id}
            onChange={(event) =>
              setForm((current) => ({ ...current, exam_id: event.target.value, weakTopicSlugs: [] }))
            }
          >
            {exams.map((exam) => (
              <option key={exam._id} value={exam._id}>{exam.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Exam date</span>
          <input
            className="input"
            type="date"
            min={minDate}
            value={form.examDate}
            onChange={(event) => setForm((current) => ({ ...current, examDate: event.target.value }))}
          />
        </label>
        <label className="block">
          <span className="label">Hours per day</span>
          <input
            className="input"
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            value={form.dailyHours}
            onChange={(event) => setForm((current) => ({ ...current, dailyHours: Number(event.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="label">Strategy</span>
          <select
            className="input"
            value={form.preferences.strategy}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                preferences: { ...current.preferences, strategy: event.target.value as GeneratorForm['preferences']['strategy'] },
              }))
            }
          >
            <option value="balanced">Balanced</option>
            <option value="weak-first">Weak topics first</option>
            <option value="intensive">Intensive</option>
          </select>
        </label>
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label">Weak topics</p>
            <p className="text-xs text-[var(--muted)]">These get extra calendar weight.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
            <label className="inline-flex items-center gap-2">
              <input
                className="h-4 w-4 accent-blue-600"
                type="checkbox"
                checked={form.preferences.include_mock_days}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preferences: { ...current.preferences, include_mock_days: event.target.checked },
                  }))
                }
              />
              Weekly mock day
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                className="h-4 w-4 accent-blue-600"
                type="checkbox"
                checked={form.preferences.weekend_boost}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preferences: { ...current.preferences, weekend_boost: event.target.checked },
                  }))
                }
              />
              Weekend boost
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {subjects.map((subject) => {
            const active = form.weakTopicSlugs.includes(subject.slug);
            return (
              <button
                key={subject._id}
                type="button"
                onClick={() => toggleWeakTopic(subject.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                    : 'border-[var(--line)] bg-[var(--bg-elev)] text-[var(--muted)]'
                }`}
              >
                {subject.name}
              </button>
            );
          })}
        </div>
      </div>

      {generate.isError && (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {(generate.error as Error).message}
        </p>
      )}

      <button
        type="button"
        className="btn-primary mt-5 w-full justify-center py-3 disabled:opacity-50"
        disabled={!form.exam_id || !form.examDate || generate.isPending}
        onClick={() => generate.mutate()}
      >
        {generate.isPending ? 'Generating plan...' : plan ? 'Regenerate smart plan' : 'Generate smart plan'}
      </button>

      {plan?.daily_schedule?.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-semibold text-[var(--text)]">Study calendar</h3>
              <p className="text-xs text-[var(--muted)]">Click a day to open tasks. Each task opens the right study flow.</p>
            </div>
            <p className="text-xs text-[var(--muted)]">First six weeks preview</p>
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-3">
            <div className="mb-2 hidden grid-cols-7 gap-2 sm:grid">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {label}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {getWeeks(plan.daily_schedule).map((week, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-7">
                {week.map((day: any) => (
                  <button
                    key={day.day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className="min-h-28 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3 text-left transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--text)]">Day {day.day}</p>
                      <span className="text-[10px] text-[var(--muted)]">{formatDate(day.date)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{day.total_minutes} min</p>
                    <progress
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full accent-blue-600"
                      value={getDayProgress(day)}
                      max={100}
                    />
                    <div className="mt-3 space-y-1">
                      <p className="text-[11px] font-semibold text-[var(--text)]">
                        {(day.tasks ?? []).length} tasks
                      </p>
                      <p className="truncate text-[11px] text-[var(--muted)]">
                        {(day.tasks ?? []).map((task: any) => task.task_type).slice(0, 3).join(' · ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--card)] shadow-2xl sm:max-w-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--card)] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                  {formatDate(selectedDay.date)}
                </p>
                <h3 className="mt-1 text-xl font-bold text-[var(--text)]">Day {selectedDay.day} tasks</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selectedDay.total_minutes} minutes planned · {getDayProgress(selectedDay)}% complete
                </p>
              </div>
              <button type="button" className="btn-secondary text-sm" onClick={() => setSelectedDay(null)}>
                Close
              </button>
            </div>

            <div className="space-y-3 p-5">
              {(selectedDay.tasks ?? []).map((task: any, index: number) => (
                <Link
                  key={`${task.task_type}-${task.subject_slug}-${index}`}
                  href={getTaskHref(task, examSlug)}
                  className="block rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/20"
                  onClick={() => setSelectedDay(null)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand)]">
                          {taskLabel(task)}
                        </span>
                        {task.is_completed && (
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
                            Completed
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 font-semibold text-[var(--text)]">{task.subject_name}</h4>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {task.duration_minutes} min
                        {task.minimum_questions ? ` · ${task.minimum_questions}+ questions` : ''}
                        {task.minimum_minutes ? ` · ${task.minimum_minutes}+ minutes` : ''}
                      </p>
                    </div>
                    <span className="btn-primary text-center text-sm">
                      Open
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
