'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NepaliDate from 'nepali-date-converter';

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

type CalendarMode = 'en' | 'ne';
type CalendarCell = {
  date: Date | null;
  key: string;
  displayDay?: number;
};
type ModalPosition = {
  top: number;
  left: number;
  transform: string;
};

const WEEKDAY_LABELS: Record<CalendarMode, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ne: ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'],
};

function getLocale(mode: CalendarMode) {
  return mode === 'ne' ? 'ne-NP' : 'en-NP';
}

function formatNumber(value: number, mode: CalendarMode) {
  return new Intl.NumberFormat(getLocale(mode), { maximumFractionDigits: 0 }).format(value);
}

function formatFullDate(value: string | Date, mode: CalendarMode) {
  if (mode === 'ne') {
    return NepaliDate.fromAD(new Date(value)).format('ddd DD, MMMM YYYY', 'np');
  }

  return new Date(value).toLocaleDateString(getLocale(mode), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kathmandu',
  });
}

function formatMonthTitle(value: Date, mode: CalendarMode) {
  if (mode === 'ne') {
    return NepaliDate.fromAD(value).format('MMMM YYYY', 'np');
  }

  return value.toLocaleDateString(getLocale(mode), {
    year: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kathmandu',
  });
}

function formatNepalTime(mode: CalendarMode) {
  return new Date().toLocaleTimeString(getLocale(mode), {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kathmandu',
  });
}

function dateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Kathmandu',
  }).formatToParts(new Date(value));
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function startOfCalendarMonth(value: Date, mode: CalendarMode) {
  if (mode === 'ne') {
    const bsDate = NepaliDate.fromAD(value);
    return new NepaliDate(bsDate.getYear(), bsDate.getMonth(), 1).toJsDate();
  }

  return startOfMonth(value);
}

function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function addCalendarMonths(value: Date, amount: number, mode: CalendarMode) {
  if (mode === 'ne') {
    const bsDate = NepaliDate.fromAD(value);
    return new NepaliDate(bsDate.getYear(), bsDate.getMonth() + amount, 1).toJsDate();
  }

  return addMonths(value, amount);
}

function getInternationalMonthCells(monthDate: Date) {
  const first = startOfMonth(monthDate);
  const startOffset = first.getDay();
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ date: null, key: `blank-start-${index}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(first.getFullYear(), first.getMonth(), day);
    cells.push({ date, key: dateKey(date), displayDay: day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `blank-end-${cells.length}` });
  }
  return cells;
}

function getNepaliMonthCells(monthDate: Date) {
  const anchor = NepaliDate.fromAD(monthDate);
  const year = anchor.getYear();
  const month = anchor.getMonth();
  const first = new NepaliDate(year, month, 1);
  const cells: CalendarCell[] = [];

  for (let index = 0; index < first.getDay(); index += 1) {
    cells.push({ date: null, key: `bs-blank-start-${index}` });
  }

  for (let day = 1; day <= 32; day += 1) {
    const bsDate = new NepaliDate(year, month, day);
    if (bsDate.getYear() !== year || bsDate.getMonth() !== month) break;
    const date = bsDate.toJsDate();
    cells.push({ date, key: dateKey(date), displayDay: day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `bs-blank-end-${cells.length}` });
  }

  return cells;
}

function getMonthCells(monthDate: Date, mode: CalendarMode) {
  return mode === 'ne' ? getNepaliMonthCells(monthDate) : getInternationalMonthCells(monthDate);
}

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
  const [modalPosition, setModalPosition] = useState<ModalPosition | null>(null);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('ne');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const firstPlanDate = initialPlan?.daily_schedule?.[0]?.date;
    return startOfCalendarMonth(firstPlanDate ? new Date(firstPlanDate) : new Date(), 'ne');
  });
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
      if (newPlan?.daily_schedule?.[0]?.date) {
        setVisibleMonth(startOfCalendarMonth(new Date(newPlan.daily_schedule[0].date), calendarMode));
      }
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

  function changeCalendarMode(mode: CalendarMode) {
    setCalendarMode(mode);
    setVisibleMonth((current) => startOfCalendarMonth(current, mode));
  }

  function openDayModal(event: MouseEvent<HTMLButtonElement>, day: any) {
    const rect = event.currentTarget.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const estimatedHeight = isMobile ? Math.min(viewportHeight * 0.62, 520) : Math.min(viewportHeight * 0.82, 720);
    const estimatedWidth = isMobile ? viewportWidth - 24 : 672;
    const edgePadding = 12;
    const preferredTop = rect.top + rect.height / 2;
    const preferredLeft = isMobile ? viewportWidth / 2 : rect.left + rect.width / 2;
    const top = Math.min(
      Math.max(preferredTop, estimatedHeight / 2 + edgePadding),
      viewportHeight - estimatedHeight / 2 - edgePadding,
    );
    const left = Math.min(
      Math.max(preferredLeft, estimatedWidth / 2 + edgePadding),
      viewportWidth - estimatedWidth / 2 - edgePadding,
    );

    setSelectedDay(day);
    setModalPosition({
      top,
      left,
      transform: 'translate(-50%, -50%)',
    });
  }

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, any>();
    for (const day of plan?.daily_schedule ?? []) {
      map.set(dateKey(day.date), day);
    }
    return map;
  }, [plan?.daily_schedule]);

  const visibleCells = useMemo(() => getMonthCells(visibleMonth, calendarMode), [visibleMonth, calendarMode]);

  useEffect(() => {
    if (!selectedDay) return undefined;
    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [selectedDay]);

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
            {formatNumber(plan.daily_schedule?.length ?? 0, calendarMode)} days planned
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
              <p className="text-xs text-[var(--muted)]">
                {calendarMode === 'ne' ? 'Bikram Sambat calendar' : 'International calendar'} · Nepal time {formatNepalTime(calendarMode)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={calendarMode === 'ne' ? 'btn-primary !px-3 !py-2 text-xs' : 'btn-secondary !px-3 !py-2 text-xs'}
                onClick={() => changeCalendarMode('ne')}
              >
                Nepali BS
              </button>
              <button
                type="button"
                className={calendarMode === 'en' ? 'btn-primary !px-3 !py-2 text-xs' : 'btn-secondary !px-3 !py-2 text-xs'}
                onClick={() => changeCalendarMode('en')}
              >
                International
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-2 sm:p-3">
            <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-2 sm:gap-3 sm:p-3">
              <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => setVisibleMonth((current) => addCalendarMonths(current, -1, calendarMode))}>
                Prev
              </button>
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate text-sm font-semibold text-[var(--text)] sm:text-base">{formatMonthTitle(visibleMonth, calendarMode)}</p>
                <p className="text-[11px] text-[var(--muted)]">{calendarMode === 'ne' ? 'Bikram Sambat' : 'Gregorian / AD'}</p>
              </div>
              <button type="button" className="btn-secondary !px-3 !py-2 text-xs" onClick={() => setVisibleMonth((current) => addCalendarMonths(current, 1, calendarMode))}>
                Next
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 sm:mb-2 sm:gap-2">
              {WEEKDAY_LABELS[calendarMode].map((label) => (
                <div key={label} className="px-1 py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)] sm:px-2 sm:text-[11px]">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {visibleCells.map((cell) => {
                const day = cell.date ? scheduleByDate.get(cell.key) : null;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={!day}
                    onClick={(event) => day && openDayModal(event, day)}
                    className={`min-h-16 rounded-xl border p-1 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)] sm:min-h-32 sm:rounded-2xl sm:p-3 ${
                      day
                        ? 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/20'
                        : 'cursor-default border-transparent bg-transparent opacity-40'
                    }`}
                  >
                    {cell.date && (
                      <div className="flex items-start justify-between gap-0.5 sm:gap-1">
                        <span className="text-xs font-bold text-[var(--text)] sm:text-sm">
                          {formatNumber(cell.displayDay ?? 0, calendarMode)}
                        </span>
                        {day && (
                          <span className="rounded-full bg-[var(--brand-soft)] px-1 py-0.5 text-[9px] font-semibold text-[var(--brand)] sm:px-1.5 sm:text-[10px]">
                            {formatNumber(day.day, calendarMode)}
                          </span>
                        )}
                      </div>
                    )}
                    {day && (
                      <div className="mt-1 sm:mt-2">
                        <p className="hidden text-[11px] text-[var(--muted)] sm:block">
                          {formatNumber(day.total_minutes, calendarMode)} min
                        </p>
                        <progress
                          className="mt-1 h-1 w-full overflow-hidden rounded-full accent-blue-600 sm:mt-2 sm:h-1.5"
                          value={getDayProgress(day)}
                          max={100}
                        />
                        <p className="mt-1 truncate text-[9px] font-semibold text-[var(--text)] sm:mt-2 sm:text-[11px]">
                          {(day.tasks ?? []).length} tasks
                        </p>
                        <p className="hidden truncate text-[11px] text-[var(--muted)] sm:block">
                          {(day.tasks ?? []).map((task: any) => task.task_type).slice(0, 2).join(' · ')}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedDay && (
        <div
          className="fixed inset-0 z-50 bg-black/55 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setSelectedDay(null);
            setModalPosition(null);
          }}
        >
          <div
            className="fixed max-h-[62dvh] w-[calc(100vw-1.5rem)] overscroll-contain overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--card)] shadow-2xl sm:max-h-[min(82dvh,720px)] sm:w-full sm:max-w-2xl"
            style={{
              top: modalPosition ? `${modalPosition.top}px` : '50%',
              left: modalPosition ? `${modalPosition.left}px` : '50%',
              transform: modalPosition?.transform ?? 'translate(-50%, -50%)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--card)] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                  {formatFullDate(selectedDay.date, calendarMode)}
                </p>
                <h3 className="mt-1 text-xl font-bold text-[var(--text)]">
                  Day {formatNumber(selectedDay.day, calendarMode)} tasks
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatNumber(selectedDay.total_minutes, calendarMode)} minutes planned · {formatNumber(getDayProgress(selectedDay), calendarMode)}% complete
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => {
                  setSelectedDay(null);
                  setModalPosition(null);
                }}
              >
                Close
              </button>
            </div>

            <div className="space-y-3 p-5">
              {(selectedDay.tasks ?? []).map((task: any, index: number) => (
                <Link
                  key={`${task.task_type}-${task.subject_slug}-${index}`}
                  href={getTaskHref(task, examSlug)}
                  className="block rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/20"
                  onClick={() => {
                    setSelectedDay(null);
                    setModalPosition(null);
                  }}
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
                        {formatNumber(task.duration_minutes, calendarMode)} min
                        {task.minimum_questions ? ` · ${formatNumber(task.minimum_questions, calendarMode)}+ questions` : ''}
                        {task.minimum_minutes ? ` · ${formatNumber(task.minimum_minutes, calendarMode)}+ minutes` : ''}
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
