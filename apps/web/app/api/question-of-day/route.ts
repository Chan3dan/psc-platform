import { Types } from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Question, QuestionOfDay, Result, User } from '@psc/shared/models';
import { err, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { CacheKeys, cacheDel } from '@/lib/redis';
import {
  getKathmanduDateKey,
  getOrCreateQuestionOfDay,
  getQuestionOfDayAttempt,
  serializeQuestionOfDay,
} from '@/lib/question-of-day';

function normalizeNegativePercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 25;
  return value <= 1 ? value * 100 : value;
}

async function resolveExamId(userId: string, requestedExamId?: string | null) {
  if (requestedExamId && Types.ObjectId.isValid(requestedExamId)) {
    const exam = await Exam.findOne({ _id: requestedExamId, is_active: true }).select('_id').lean() as any;
    return exam ? String(exam._id) : null;
  }

  const user = (await User.findById(userId)
    .select('preferences.target_exam_id')
    .lean()) as any;

  const preferredExamId = user?.preferences?.target_exam_id;
  return preferredExamId ? String(preferredExamId) : null;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(req.url);
    const examId = await resolveExamId(session.user.id, searchParams.get('exam_id'));
    if (!examId) {
      return err('Select an exam focus first to unlock the question of the day.', 400);
    }

    const questionOfDay = await getOrCreateQuestionOfDay({ examId });
    if (!questionOfDay) {
      return err('No question of the day is available for this exam yet.', 404);
    }

    const attempt = await getQuestionOfDayAttempt(String(questionOfDay._id), session.user.id);
    return ok(serializeQuestionOfDay(questionOfDay, attempt));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return err('Invalid request body');

    const questionOfDayId = typeof (body as any).question_of_day_id === 'string' ? (body as any).question_of_day_id : '';
    const selectedOption = typeof (body as any).selected_option === 'number' ? (body as any).selected_option : null;
    const timeSpentSeconds = Math.max(0, Number((body as any).time_spent_seconds ?? 30));

    if (!Types.ObjectId.isValid(questionOfDayId)) {
      return err('question_of_day_id is required');
    }
    if (selectedOption === null || selectedOption < 0) {
      return err('selected_option is required');
    }

    await connectDB();

    const questionOfDay = await QuestionOfDay.findById(questionOfDayId).lean() as any;
    if (!questionOfDay) return err('Question of the day not found', 404);

    const existing = await getQuestionOfDayAttempt(questionOfDayId, session.user.id);
    if (existing) {
      const hydrated = await getOrCreateQuestionOfDay({ examId: String(questionOfDay.exam_id) });
      return ok({
        alreadySubmitted: true,
        questionOfDay: serializeQuestionOfDay(hydrated, existing),
      });
    }

    const [question, exam] = await Promise.all([
      Question.findById(questionOfDay.question_id)
        .select('_id question_text options correct_answer explanation subject_id')
        .populate('subject_id', 'name')
        .lean() as Promise<any>,
      Exam.findById(questionOfDay.exam_id)
        .select('total_marks total_questions negative_marking')
        .lean() as Promise<any>,
    ]);

    if (!question || !exam) {
      return err('Daily question configuration is incomplete', 404);
    }

    const marksPerQuestion = exam.total_questions
      ? parseFloat((exam.total_marks / exam.total_questions).toFixed(4))
      : 1;
    const negativePercent = normalizeNegativePercent(exam.negative_marking);
    const penalty = parseFloat(((marksPerQuestion * negativePercent) / 100).toFixed(4));
    const isCorrect = selectedOption === question.correct_answer;
    const marksAwarded = isCorrect ? marksPerQuestion : -penalty;

    const result = await Result.create({
      user_id: session.user.id,
      test_id: null,
      test_type: 'daily_question',
      exam_id: questionOfDay.exam_id,
      answers: [
        {
          question_id: question._id,
          selected_option: selectedOption,
          flagged: false,
          is_correct: isCorrect,
          marks_awarded: marksAwarded,
          time_spent_seconds: timeSpentSeconds,
        },
      ],
      score: marksAwarded,
      max_score: marksPerQuestion,
      accuracy_percent: isCorrect ? 100 : 0,
      correct_count: isCorrect ? 1 : 0,
      wrong_count: isCorrect ? 0 : 1,
      skipped_count: 0,
      total_time_seconds: timeSpentSeconds,
      subject_breakdown: [
        {
          subject_id: question.subject_id?._id ?? question.subject_id,
          subject_name: question.subject_id?.name ?? 'General',
          attempted: 1,
          correct: isCorrect ? 1 : 0,
          wrong: isCorrect ? 0 : 1,
          skipped: 0,
          marks_earned: marksAwarded,
          accuracy_percent: isCorrect ? 100 : 0,
          avg_time_per_question: timeSpentSeconds,
        },
      ],
      result_context: {
        kind: 'question_of_day',
        question_of_day_id: questionOfDay._id,
        label: 'Question of the Day',
        submitted_for_date: questionOfDay.prompt_date_key ?? getKathmanduDateKey(),
      },
    });

    await Promise.all([
      User.findByIdAndUpdate(session.user.id, {
        $inc: {
          'stats.total_tests': 1,
          'stats.total_questions_attempted': 1,
        },
        $set: { 'stats.last_active': new Date() },
      }),
      Question.findByIdAndUpdate(question._id, {
        $inc: {
          attempt_count: 1,
          ...(isCorrect ? { correct_count: 1 } : {}),
        },
      }),
      cacheDel(CacheKeys.dashboardSummary(session.user.id)),
      cacheDel(CacheKeys.resultsHistory(session.user.id)),
      cacheDel(CacheKeys.adminResults()),
    ]);

    const hydrated = await getOrCreateQuestionOfDay({ examId: String(questionOfDay.exam_id) });
    const attempt = await getQuestionOfDayAttempt(questionOfDayId, session.user.id);

    return ok({
      result_id: String(result._id),
      questionOfDay: serializeQuestionOfDay(hydrated, attempt),
    });
  } catch (error) {
    return serverError(error);
  }
}
