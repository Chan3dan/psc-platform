// ============================================================
// PSC PLATFORM — STUDY PLANNER ALGORITHM
// File: packages/shared/utils/planner.ts
// ============================================================

import { SubjectPerformance } from './analytics';

interface PlannerInput {
  exam_id: string;
  target_date: Date;
  daily_hours: number;
  subjects: Array<{
    subject_id: string;
    subject_name: string;
    weightage_percent: number;
  }>;
  performance?: SubjectPerformance[]; // existing performance data (optional)
  preferences?: {
    strategy?: 'balanced' | 'weak-first' | 'intensive';
    include_mock_days?: boolean;
    revision_split_percent?: number; // final-days revision split
    preferred_session_minutes?: number;
    weekend_boost?: boolean;
  };
}

interface DailyTask {
  subject_id: string;
  subject_name: string;
  task_type: 'practice' | 'revision' | 'mock';
  duration_minutes: number;
  question_count: number;
}

interface DayPlan {
  day: number;
  date: Date;
  tasks: DailyTask[];
  total_minutes: number;
  is_completed: boolean;
}

export interface GeneratedPlan {
  title: string;
  exam_id: string;
  target_date: Date;
  daily_hours: number;
  total_days: number;
  daily_schedule: DayPlan[];
}

// ─────────────────────────────────────────────
// MAIN PLANNER ALGORITHM
//
// Strategy:
//  1. Calculate days available
//  2. Allocate time per subject by weightage
//  3. Boost weak subjects by +20% time
//  4. Every 7th day = Mock Test day (full revision)
//  5. Final 3 days = intensive revision only
// ─────────────────────────────────────────────
export function generateStudyPlan(input: PlannerInput): GeneratedPlan {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(input.target_date);
  target.setHours(0, 0, 0, 0);

  const total_days = Math.max(
    1,
    Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const daily_minutes = input.daily_hours * 60;
  const strategy = input.preferences?.strategy ?? 'balanced';
  const includeMockDays = input.preferences?.include_mock_days ?? true;
  const revisionSplitPercent = Math.min(Math.max(input.preferences?.revision_split_percent ?? 100, 40), 100);
  const preferredSessionMinutes = Math.min(Math.max(input.preferences?.preferred_session_minutes ?? 45, 25), 120);
  const weekendBoost = input.preferences?.weekend_boost ?? false;
  const effective_days = total_days - 3; // last 3 days reserved for revision
  const fallbackSubjectId = input.subjects[0]?.subject_id ?? '';
  const fallbackSubjectName = input.subjects[0]?.subject_name ?? 'General';

  // ── Step 1: Calculate effective weightage
  // Boost weak subjects depending on strategy.
  const subjectWeights = input.subjects.map(s => {
    const perf = input.performance?.find(p => p.subject_id === s.subject_id);
    const weakBoostByStrategy =
      strategy === 'weak-first' ? 1.8 :
      strategy === 'intensive' ? 1.35 :
      1.5;
    const weakness_boost = perf && perf.avg_accuracy < 50 ? weakBoostByStrategy : 1.0;
    return {
      ...s,
      adjusted_weight: s.weightage_percent * weakness_boost,
    };
  });

  const total_weight = subjectWeights.reduce((acc, s) => acc + s.adjusted_weight, 0);

  // ── Step 2: Minutes per subject per day
  const subjectDailyMinutes = subjectWeights.map(s => ({
    ...s,
    daily_minutes: (s.adjusted_weight / total_weight) * daily_minutes,
  }));

  // ── Step 3: Generate daily schedule
  const daily_schedule: DayPlan[] = [];

  for (let day = 1; day <= total_days; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day - 1);

    const is_mock_day = day % 7 === 0 && day <= effective_days;
    const is_revision_day = day > effective_days;
    const dayOfWeek = date.getDay(); // 0 Sun - 6 Sat
    const dayMinutes =
      weekendBoost && (dayOfWeek === 0 || dayOfWeek === 6)
        ? Math.round(daily_minutes * 1.15)
        : daily_minutes;

    let tasks: DailyTask[];

    if (is_mock_day && includeMockDays) {
      // Mock test day: 2h mock + light review
      const mockDuration = Math.min(120, Math.round(dayMinutes * 0.7));
      tasks = [
        {
          // Use a valid subject ObjectId string to satisfy StudyPlan schema.
          subject_id: fallbackSubjectId,
          subject_name: 'Full Mock Test',
          task_type: 'mock',
          duration_minutes: mockDuration,
          question_count: 100,
        },
        {
          subject_id: fallbackSubjectId,
          subject_name: `Review Mistakes (${fallbackSubjectName})`,
          task_type: 'revision',
          duration_minutes: Math.max(20, Math.min(dayMinutes - mockDuration, 75)),
          question_count: 0,
        },
      ];
    } else if (is_revision_day) {
      // Final days: cycle through all subjects equally
      const revisionMinutes = Math.round((dayMinutes * revisionSplitPercent) / 100);
      const minutesPer = Math.max(20, Math.floor(revisionMinutes / subjectWeights.length));
      tasks = subjectWeights.map(s => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        task_type: 'revision' as const,
        duration_minutes: minutesPer,
        question_count: Math.floor(minutesPer / 2),
      }));
    } else {
      // Regular day: distribute by subject weight
      // Cycle through subjects — each day covers 2-3 subjects deeply
      const subjectsPerDay = strategy === 'intensive' ? 3 : 2;
      const daySubjects = pickSubjectsForDay(subjectDailyMinutes, day, dayMinutes, subjectsPerDay);
      tasks = daySubjects.map(s => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        task_type: day % 3 === 0 ? ('revision' as const) : ('practice' as const),
        duration_minutes: Math.round(s.allocated_minutes),
        question_count: Math.max(5, Math.floor(s.allocated_minutes / Math.max(1, preferredSessionMinutes / 30))),
      }));
    }

    const total = tasks.reduce((acc, t) => acc + t.duration_minutes, 0);
    daily_schedule.push({
      day,
      date,
      tasks,
      total_minutes: total,
      is_completed: false,
    });
  }

  const examName = input.subjects[0]?.subject_name ?? 'Exam';
  return {
    title: `${total_days}-Day Study Plan`,
    exam_id: input.exam_id,
    target_date: input.target_date,
    daily_hours: input.daily_hours,
    total_days,
    daily_schedule,
  };
}

// ─────────────────────────────────────────────
// SUBJECT ROTATION LOGIC
// Ensures every subject gets coverage
// Uses round-robin with weight-based time split
// ─────────────────────────────────────────────
function pickSubjectsForDay(
  subjects: Array<{ subject_id: string; subject_name: string; daily_minutes: number }>,
  day: number,
  total_minutes: number,
  desiredCount = 2
): Array<{ subject_id: string; subject_name: string; allocated_minutes: number }> {
  // Rotate 2 subjects per day (more depth, less spread)
  const subjectCount = subjects.length;
  const count = Math.min(Math.max(1, desiredCount), subjectCount);
  const startIndex = (day - 1) % subjectCount;

  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push(subjects[(startIndex + i) % subjectCount]);
  }

  // Normalize to total_minutes
  const pickedTotal = picked.reduce((acc, s) => acc + s.daily_minutes, 0);
  return picked.map(s => ({
    subject_id: s.subject_id,
    subject_name: s.subject_name,
    allocated_minutes: (s.daily_minutes / pickedTotal) * total_minutes,
  }));
}

// ─────────────────────────────────────────────
// STREAK UPDATER
// Called on each day completion
// ─────────────────────────────────────────────
export function updateStreak(
  lastActiveDate: Date | undefined,
  currentStreak: number
): { new_streak: number; broken: boolean } {
  if (!lastActiveDate) return { new_streak: 1, broken: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastActiveDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    return { new_streak: currentStreak + 1, broken: false };
  } else if (diffDays === 0) {
    // Same day, no change
    return { new_streak: currentStreak, broken: false };
  } else {
    // Streak broken
    return { new_streak: 1, broken: true };
  }
}
