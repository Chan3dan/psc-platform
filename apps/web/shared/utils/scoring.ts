// ============================================================
// PSC PLATFORM — CORE SCORING & MCQ ENGINE
// ============================================================

import { Types } from 'mongoose';
import { IAnswer, ISubjectBreakdown } from '../models';

export interface ScoringConfig {
  marks_per_question: number;
  negative_marks_per_wrong: number;
}

export interface QuestionResult {
  question_id: string;
  selected_option: number | null;
  flagged?: boolean;
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
      raw_score += marks_awarded;
      wrong_count++;
    } else {
      skipped_count++;
    }

    answers.push({
      question_id: new Types.ObjectId(q.question_id),
      selected_option: q.selected_option,
      flagged: Boolean(q.flagged),
      is_correct,
      marks_awarded,
      time_spent_seconds: q.time_spent_seconds,
    } as IAnswer);

    if (!subjectMap.has(q.subject_id)) {
      subjectMap.set(q.subject_id, {
        subject_name: q.subject_name,
        attempted: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        marks_earned: 0,
        total_time: 0,
      });
    }
    const subject = subjectMap.get(q.subject_id)!;
    subject.total_time += q.time_spent_seconds;
    if (skipped) {
      subject.skipped++;
    } else {
      subject.attempted++;
      if (is_correct) {
        subject.correct++;
        subject.marks_earned += config.marks_per_question;
      } else {
        subject.wrong++;
        subject.marks_earned -= config.negative_marks_per_wrong;
      }
    }
  }

  const max_score = questions.length * config.marks_per_question;
  const attempted = correct_count + wrong_count;
  const accuracy_percent = attempted > 0
    ? parseFloat(((correct_count / attempted) * 100).toFixed(2))
    : 0;

  const subject_breakdown: ISubjectBreakdown[] = Array.from(subjectMap.entries()).map(
    ([subject_id, subject]) => ({
      subject_id: new Types.ObjectId(subject_id),
      subject_name: subject.subject_name,
      attempted: subject.attempted,
      correct: subject.correct,
      wrong: subject.wrong,
      skipped: subject.skipped,
      marks_earned: parseFloat(subject.marks_earned.toFixed(2)),
      accuracy_percent: subject.attempted > 0
        ? parseFloat(((subject.correct / subject.attempted) * 100).toFixed(2))
        : 0,
      avg_time_per_question: subject.attempted > 0
        ? parseFloat((subject.total_time / (subject.attempted + subject.skipped)).toFixed(1))
        : 0,
    })
  );

  return {
    answers,
    score: parseFloat(Math.max(0, raw_score).toFixed(2)),
    max_score,
    accuracy_percent,
    correct_count,
    wrong_count,
    skipped_count,
    subject_breakdown,
  };
}

export function calculatePercentile(userScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 100;
  const below = allScores.filter((score) => score < userScore).length;
  return parseFloat(((below / allScores.length) * 100).toFixed(1));
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function shuffleOptions(
  options: Array<{ index: number; text: string }>,
  correct_answer: number
): { options: Array<{ index: number; text: string; display_index: number }>; new_correct_index: number } {
  const shuffled = shuffleArray(options);
  const new_correct_index = shuffled.findIndex((option) => option.index === correct_answer);
  const reindexed = shuffled.map((option, i) => ({ ...option, display_index: i }));
  return { options: reindexed, new_correct_index };
}
