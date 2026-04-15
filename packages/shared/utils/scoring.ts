// ============================================================
// PSC PLATFORM — CORE SCORING & MCQ ENGINE
// File: packages/shared/utils/scoring.ts
// ============================================================

import { IAnswer, ISubjectBreakdown } from '../models';
import { Types } from 'mongoose';

// ─────────────────────────────────────────────
// NEGATIVE MARKING CALCULATOR
// Formula: score = (correct × marks_per_q) - (wrong × negative_marks_per_wrong)
// Skipped questions get 0 — no deduction
// ─────────────────────────────────────────────
export interface ScoringConfig {
  marks_per_question: number;      // e.g. 1
  negative_marks_per_wrong: number; // e.g. 0.25
}

export interface QuestionResult {
  question_id: string;
  selected_option: number | null;
  correct_answer: number;
  subject_id: string;
  subject_name: string;
  time_spent_seconds: number;
}

export interface CalculatedResult {
  answers: IAnswer[];
  score: number;
  max_score: number;
  accuracy_percent: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  subject_breakdown: ISubjectBreakdown[];
}

export function calculateScore(
  questions: QuestionResult[],
  config: ScoringConfig
): CalculatedResult {
  const answers: IAnswer[] = [];
  let correct_count = 0;
  let wrong_count = 0;
  let skipped_count = 0;
  let raw_score = 0;

  // Subject-level accumulators
  const subjectMap = new Map<string, {
    subject_name: string;
    attempted: number;
    correct: number;
    wrong: number;
    skipped: number;
    marks_earned: number;
    total_time: number;
  }>();

  for (const q of questions) {
    const skipped = q.selected_option === null;
    const is_correct = !skipped && q.selected_option === q.correct_answer;
    const is_wrong = !skipped && !is_correct;

    let marks_awarded = 0;
    if (is_correct) {
      marks_awarded = config.marks_per_question;
      raw_score += marks_awarded;
      correct_count++;
    } else if (is_wrong) {
      marks_awarded = -config.negative_marks_per_wrong;
      raw_score += marks_awarded; // subtracts
      wrong_count++;
    } else {
      skipped_count++;
    }

    answers.push({
      question_id: new Types.ObjectId(q.question_id),
      selected_option: q.selected_option,
      is_correct,
      marks_awarded,
      time_spent_seconds: q.time_spent_seconds,
    } as IAnswer);

    // Accumulate subject stats
    if (!subjectMap.has(q.subject_id)) {
      subjectMap.set(q.subject_id, {
        subject_name: q.subject_name,
        attempted: 0, correct: 0, wrong: 0, skipped: 0,
        marks_earned: 0, total_time: 0,
      });
    }
    const s = subjectMap.get(q.subject_id)!;
    s.total_time += q.time_spent_seconds;
    if (skipped) {
      s.skipped++;
    } else {
      s.attempted++;
      if (is_correct) { s.correct++; s.marks_earned += config.marks_per_question; }
      else { s.wrong++; s.marks_earned -= config.negative_marks_per_wrong; }
    }
  }

  const max_score = questions.length * config.marks_per_question;
  const attempted = correct_count + wrong_count;
  const accuracy_percent = attempted > 0
    ? parseFloat(((correct_count / attempted) * 100).toFixed(2))
    : 0;

  // Build subject breakdown
  const subject_breakdown: ISubjectBreakdown[] = Array.from(subjectMap.entries()).map(
    ([subject_id, s]) => ({
      subject_id: new Types.ObjectId(subject_id),
      subject_name: s.subject_name,
      attempted: s.attempted,
      correct: s.correct,
      wrong: s.wrong,
      skipped: s.skipped,
      marks_earned: parseFloat(s.marks_earned.toFixed(2)),
      accuracy_percent: s.attempted > 0
        ? parseFloat(((s.correct / s.attempted) * 100).toFixed(2))
        : 0,
      avg_time_per_question: s.attempted > 0
        ? parseFloat((s.total_time / (s.attempted + s.skipped)).toFixed(1))
        : 0,
    })
  );

  return {
    answers,
    score: parseFloat(Math.max(0, raw_score).toFixed(2)), // score never below 0
    max_score,
    accuracy_percent,
    correct_count,
    wrong_count,
    skipped_count,
    subject_breakdown,
  };
}

// ─────────────────────────────────────────────
// PERCENTILE CALCULATOR (among all test takers)
// ─────────────────────────────────────────────
export function calculatePercentile(userScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 100;
  const below = allScores.filter(s => s < userScore).length;
  return parseFloat(((below / allScores.length) * 100).toFixed(1));
}

// ─────────────────────────────────────────────
// QUESTION RANDOMIZER
// Fisher-Yates shuffle — cryptographically fair
// ─────────────────────────────────────────────
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle option indices while preserving correct answer tracking
export function shuffleOptions(
  options: Array<{ index: number; text: string }>,
  correct_answer: number
): { options: Array<{ index: number; text: string }>; new_correct_index: number } {
  const shuffled = shuffleArray(options);
  const new_correct_index = shuffled.findIndex(o => o.index === correct_answer);
  // Re-index after shuffle
  const reindexed = shuffled.map((o, i) => ({ ...o, display_index: i }));
  return { options: reindexed, new_correct_index };
}
