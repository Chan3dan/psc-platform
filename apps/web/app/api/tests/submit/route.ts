import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Question, Result, User } from '@psc/shared/models';
import { ok, err, unauthorized, serverError } from '@/lib/apiResponse';
import { calculateScore, calculatePercentile } from '@psc/shared/utils/scoring';
import { Types } from 'mongoose';

function normalizeNegativePercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 25;
  // Backward compatibility: old values like 0.2 should be interpreted as 20%.
  return value <= 1 ? value * 100 : value;
}

function normalizeId(value: unknown): string | null {
  if (typeof value === 'string' && Types.ObjectId.isValid(value)) return value;
  if (value && typeof value === 'object' && '$oid' in (value as any)) {
    const oid = String((value as any).$oid);
    if (Types.ObjectId.isValid(oid)) return oid;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const {
      test_id,
      exam_id,
      test_type = 'mock',
      answers: submittedAnswers,
      total_time_seconds = 0,
    } = await req.json();

    if (!Array.isArray(submittedAnswers) || submittedAnswers.length === 0) {
      return err('answers array is required');
    }
    const normalizedExamId = normalizeId(exam_id);
    if (!normalizedExamId) return err('exam_id is required');

    const normalizedAnswers = submittedAnswers
      .map((a: any) => {
        const qid = normalizeId(a?.question_id);
        if (!qid) return null;
        return {
          ...a,
          question_id: qid,
        };
      })
      .filter(Boolean) as Array<{ question_id: string; selected_option: number | null; time_spent_seconds?: number }>;

    if (normalizedAnswers.length === 0) return err('No valid answers to submit');

    // Fetch all questions with correct answers (server-side only)
    const questionIds = normalizedAnswers.map((a) => new Types.ObjectId(a.question_id));
    const [questions, exam] = await Promise.all([
      Question.find({ _id: { $in: questionIds } })
        .select('_id correct_answer subject_id difficulty explanation')
        .populate('subject_id', 'name')
        .lean(),
      Exam.findById(normalizedExamId).select('negative_marking total_marks total_questions').lean() as any,
    ]);

    const questionMap = new Map(questions.map((q: any) => [q._id.toString(), q]));

    const marks_per_question = exam?.total_questions
      ? parseFloat((exam.total_marks / exam.total_questions).toFixed(4))
      : 1;
    const negative_percent = normalizeNegativePercent(exam?.negative_marking);
    const negative_marks_per_wrong = parseFloat(((marks_per_question * negative_percent) / 100).toFixed(4));

    // Build full question result objects
    const questionResults = normalizedAnswers.map((a: any) => {
      const q = questionMap.get(a.question_id?.toString());
      if (!q) throw new Error(`Question ${a.question_id} not found`);
      return {
        question_id: a.question_id,
        selected_option: a.selected_option ?? null,
        correct_answer: (q as any).correct_answer,
        subject_id: ((q as any).subject_id as any)?._id?.toString() ?? '',
        subject_name: ((q as any).subject_id as any)?.name ?? 'Unknown',
        time_spent_seconds: a.time_spent_seconds ?? 0,
      };
    });

    // Score with negative marking
    const calculated = calculateScore(questionResults, {
      marks_per_question,
      negative_marks_per_wrong,
    });

    // Compute percentile among all attempts on this test
    const allResults = test_id
      ? await Result.find({ test_id }).select('score').lean()
      : [];
    const allScores = allResults.map((r: any) => r.score);
    const percentile = calculatePercentile(calculated.score, allScores);

    // Save result
    const result = await Result.create({
      user_id: session.user.id,
      test_id: test_id || null,
      test_type,
      exam_id: normalizedExamId,
      answers: calculated.answers,
      score: calculated.score,
      max_score: calculated.max_score,
      accuracy_percent: calculated.accuracy_percent,
      correct_count: calculated.correct_count,
      wrong_count: calculated.wrong_count,
      skipped_count: calculated.skipped_count,
      total_time_seconds,
      subject_breakdown: calculated.subject_breakdown,
      percentile,
    });

    // Update user stats async (non-blocking)
    User.findByIdAndUpdate(session.user.id, {
      $inc: {
        'stats.total_tests': 1,
        'stats.total_questions_attempted':
          calculated.correct_count + calculated.wrong_count + calculated.skipped_count,
      },
      $set: { 'stats.last_active': new Date() },
    }).exec();

    // Update question attempt stats async (bulk)
    const bulkOps = questionResults.map((qr) => ({
      updateOne: {
        filter: { _id: qr.question_id },
        update: {
          $inc: {
            attempt_count: 1,
            ...(qr.selected_option === qr.correct_answer ? { correct_count: 1 } : {}),
          },
        },
      },
    }));
    Question.bulkWrite(bulkOps).catch(console.error);

    // Build correct answers and explanations map for result display
    const correctAnswers: Record<string, number> = {};
    const explanations: Record<string, string> = {};
    questions.forEach((q: any) => {
      correctAnswers[q._id.toString()] = q.correct_answer;
      if (q.explanation) explanations[q._id.toString()] = q.explanation;
    });

    return ok({
      result_id: result._id.toString(),
      score: calculated.score,
      max_score: calculated.max_score,
      accuracy_percent: calculated.accuracy_percent,
      correct_count: calculated.correct_count,
      wrong_count: calculated.wrong_count,
      skipped_count: calculated.skipped_count,
      subject_breakdown: calculated.subject_breakdown,
      percentile,
      correct_answers: correctAnswers,
      explanations,
      time_taken_seconds: total_time_seconds,
    });
  } catch (e) {
    return serverError(e);
  }
}
