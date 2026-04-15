import { Exam, Question, Result, Subject, User } from '@psc/shared/models';
import { Types } from 'mongoose';

function dayRange(days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { start, today };
}

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fillDailyBuckets(days: number, raw: Array<{ _id: string; count: number }>) {
  const { start } = dayRange(days);
  const map = new Map(raw.map((x) => [x._id, x.count]));
  const out: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toDayKey(d);
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
}

export async function getDailyRegistrations(days: number) {
  const { start } = dayRange(days);
  const raw = await User.aggregate([
    { $match: { created_at: { $gte: start } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return fillDailyBuckets(days, raw);
}

export async function getDailyAttempts(days: number) {
  const { start } = dayRange(days);
  const raw = await Result.aggregate([
    { $match: { created_at: { $gte: start } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return fillDailyBuckets(days, raw);
}

export async function getMostAttemptedQuestions(limit: number) {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  return Question.aggregate([
    { $match: { is_active: true } },
    { $sort: { attempt_count: -1, correct_count: -1, created_at: -1 } },
    { $limit: safeLimit },
    {
      $lookup: {
        from: 'subjects',
        localField: 'subject_id',
        foreignField: '_id',
        as: 'subject',
      },
    },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        question_text: 1,
        attempt_count: { $ifNull: ['$attempt_count', 0] },
        correct_count: { $ifNull: ['$correct_count', 0] },
        subject_name: '$subject.name',
      },
    },
  ]);
}

export async function getExamAccuracy() {
  return Result.aggregate([
    {
      $group: {
        _id: '$exam_id',
        attempts: { $sum: 1 },
        avg_accuracy: { $avg: '$accuracy_percent' },
        avg_score_percent: {
          $avg: {
            $cond: [
              { $gt: ['$max_score', 0] },
              { $multiply: [{ $divide: ['$score', '$max_score'] }, 100] },
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'exams',
        localField: '_id',
        foreignField: '_id',
        as: 'exam',
      },
    },
    { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        exam_id: '$_id',
        exam_name: '$exam.name',
        attempts: 1,
        avg_accuracy: { $round: ['$avg_accuracy', 2] },
        avg_score_percent: { $round: ['$avg_score_percent', 2] },
      },
    },
    { $sort: { attempts: -1, exam_name: 1 } },
  ]);
}

export async function getSubjectDifficultyHeatmap() {
  const rows = await Question.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: { exam_id: '$exam_id', subject_id: '$subject_id' },
        attempts: { $sum: { $ifNull: ['$attempt_count', 0] } },
        correct: { $sum: { $ifNull: ['$correct_count', 0] } },
      },
    },
    {
      $lookup: {
        from: 'exams',
        localField: '_id.exam_id',
        foreignField: '_id',
        as: 'exam',
      },
    },
    { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id.subject_id',
        foreignField: '_id',
        as: 'subject',
      },
    },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        exam_id: '$_id.exam_id',
        subject_id: '$_id.subject_id',
        exam_name: '$exam.name',
        subject_name: '$subject.name',
        attempts: 1,
        correct: 1,
        accuracy: {
          $cond: [{ $gt: ['$attempts', 0] }, { $multiply: [{ $divide: ['$correct', '$attempts'] }, 100] }, 0],
        },
      },
    },
    { $sort: { exam_name: 1, subject_name: 1 } },
  ]);

  return rows.map((r: any) => ({
    ...r,
    accuracy: Math.round((r.accuracy ?? 0) * 100) / 100,
  }));
}

