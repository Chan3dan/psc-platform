// ============================================================
// PSC PLATFORM — PERFORMANCE ANALYTICS ENGINE
// ============================================================

import { IResult } from '../models';

export interface SubjectPerformance {
  subject_id: string;
  subject_name: string;
  attempts: number;
  avg_accuracy: number;
  avg_score: number;
  trend: 'improving' | 'declining' | 'stable';
  is_weak: boolean;
}

export interface TimeAnalysis {
  avg_time_per_question: number;
  slow_questions_percent: number;
  fastest_subject: string;
  slowest_subject: string;
}

export interface PerformanceInsight {
  type: 'weakness' | 'strength' | 'pattern' | 'milestone';
  message: string;
  subject?: string;
  metric?: number;
}

export interface FullAnalytics {
  overall_accuracy: number;
  avg_score_percent: number;
  total_tests: number;
  total_questions: number;
  subject_performance: SubjectPerformance[];
  weak_topics: SubjectPerformance[];
  time_analysis: TimeAnalysis;
  insights: PerformanceInsight[];
  score_history: Array<{ date: string; score_percent: number; accuracy: number }>;
}

export function generateAnalytics(results: IResult[]): FullAnalytics {
  if (results.length === 0) {
    return emptyAnalytics();
  }

  const subjectAgg = new Map<string, {
    subject_name: string;
    total_correct: number;
    total_attempted: number;
    total_marks: number;
    max_marks: number;
    result_accuracies: number[];
  }>();

  let total_correct = 0;
  let total_attempted = 0;
  let total_time = 0;
  let total_questions_all = 0;

  const score_history = results.map((r) => ({
    date: r.created_at.toISOString().split('T')[0],
    score_percent: parseFloat(((r.score / r.max_score) * 100).toFixed(1)),
    accuracy: r.accuracy_percent,
  }));

  for (const result of results) {
    total_correct += result.correct_count;
    total_attempted += result.correct_count + result.wrong_count;
    total_questions_all += result.answers.length;
    total_time += result.total_time_seconds;

    for (const sb of result.subject_breakdown) {
      const key = sb.subject_id.toString();
      if (!subjectAgg.has(key)) {
        subjectAgg.set(key, {
          subject_name: sb.subject_name,
          total_correct: 0,
          total_attempted: 0,
          total_marks: 0,
          max_marks: 0,
          result_accuracies: [],
        });
      }
      const agg = subjectAgg.get(key)!;
      agg.total_correct += sb.correct;
      agg.total_attempted += sb.attempted;
      agg.total_marks += sb.marks_earned;
      agg.result_accuracies.push(sb.accuracy_percent);
    }
  }

  const overall_accuracy = total_attempted > 0
    ? parseFloat(((total_correct / total_attempted) * 100).toFixed(1))
    : 0;

  const avg_score_percent = results.length > 0
    ? parseFloat(
        (results.reduce((acc, r) => acc + (r.score / r.max_score) * 100, 0) / results.length).toFixed(1)
      )
    : 0;

  const subject_performance: SubjectPerformance[] = [];
  for (const [subject_id, agg] of subjectAgg.entries()) {
    const avg_accuracy = agg.total_attempted > 0
      ? parseFloat(((agg.total_correct / agg.total_attempted) * 100).toFixed(1))
      : 0;

    subject_performance.push({
      subject_id,
      subject_name: agg.subject_name,
      attempts: agg.total_attempted,
      avg_accuracy,
      avg_score: parseFloat(agg.total_marks.toFixed(1)),
      trend: calculateTrend(agg.result_accuracies),
      is_weak: avg_accuracy < 50,
    });
  }

  subject_performance.sort((a, b) => b.avg_accuracy - a.avg_accuracy);
  const weak_topics = subject_performance.filter((s) => s.is_weak);

  const avg_time_per_question = total_questions_all > 0
    ? parseFloat((total_time / total_questions_all).toFixed(1))
    : 0;

  const subjectTimes = Array.from(subjectAgg.entries()).map(([, agg]) => ({
    name: agg.subject_name,
    avg: agg.total_attempted > 0 ? total_time / total_questions_all : 0,
  }));

  const time_analysis: TimeAnalysis = {
    avg_time_per_question,
    slow_questions_percent: estimateSlowPercent(results),
    fastest_subject: subjectTimes[0]?.name ?? '',
    slowest_subject: subjectTimes[subjectTimes.length - 1]?.name ?? '',
  };

  return {
    overall_accuracy,
    avg_score_percent,
    total_tests: results.length,
    total_questions: total_questions_all,
    subject_performance,
    weak_topics,
    time_analysis,
    insights: generateInsights(subject_performance, time_analysis, results),
    score_history,
  };
}

function calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 4) return 'stable';
  const half = Math.floor(values.length / 2);
  const firstHalfAvg = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const secondHalfAvg = values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half);
  const delta = secondHalfAvg - firstHalfAvg;
  if (delta > 5) return 'improving';
  if (delta < -5) return 'declining';
  return 'stable';
}

function estimateSlowPercent(results: IResult[]): number {
  let slow = 0;
  let total = 0;
  for (const r of results) {
    const times = r.answers.map((a) => a.time_spent_seconds).filter((t) => t > 0);
    if (times.length === 0) continue;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    slow += times.filter((t) => t > avg * 2).length;
    total += times.length;
  }
  return total > 0 ? parseFloat(((slow / total) * 100).toFixed(1)) : 0;
}

function generateInsights(
  subjects: SubjectPerformance[],
  time: TimeAnalysis,
  results: IResult[]
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];

  for (const s of subjects.filter((subject) => subject.is_weak).slice(0, 3)) {
    insights.push({
      type: 'weakness',
      message: `You are weak in ${s.subject_name} — accuracy is ${s.avg_accuracy}%. Focus revision here.`,
      subject: s.subject_name,
      metric: s.avg_accuracy,
    });
  }

  const strongest = subjects.find((s) => s.avg_accuracy >= 80);
  if (strongest) {
    insights.push({
      type: 'strength',
      message: `${strongest.subject_name} is your strongest area at ${strongest.avg_accuracy}% accuracy.`,
      subject: strongest.subject_name,
      metric: strongest.avg_accuracy,
    });
  }

  if (time.slow_questions_percent > 25) {
    insights.push({
      type: 'pattern',
      message: `${time.slow_questions_percent}% of your answers take over 2× the average time. Practice timed drills to build speed.`,
      metric: time.slow_questions_percent,
    });
  }

  if (results.length >= 3) {
    const recentAvg = results.slice(-3).reduce((acc, r) => acc + (r.score / r.max_score) * 100, 0) / 3;
    const olderAvg = results.slice(0, 3).reduce((acc, r) => acc + (r.score / r.max_score) * 100, 0) / 3;
    if (recentAvg > olderAvg + 5) {
      insights.push({
        type: 'milestone',
        message: `Your scores have improved by ${(recentAvg - olderAvg).toFixed(1)}% over your recent tests. Keep it up!`,
      });
    }
  }

  const declining = subjects.find((s) => s.trend === 'declining');
  if (declining) {
    insights.push({
      type: 'pattern',
      message: `Your performance in ${declining.subject_name} has been declining recently. Schedule a focused revision session.`,
      subject: declining.subject_name,
    });
  }

  return insights;
}

function emptyAnalytics(): FullAnalytics {
  return {
    overall_accuracy: 0,
    avg_score_percent: 0,
    total_tests: 0,
    total_questions: 0,
    subject_performance: [],
    weak_topics: [],
    time_analysis: { avg_time_per_question: 0, slow_questions_percent: 0, fastest_subject: '', slowest_subject: '' },
    insights: [],
    score_history: [],
  };
}
