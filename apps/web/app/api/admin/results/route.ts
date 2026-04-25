import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Question, Result } from '@psc/shared/models';
import { forbidden, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { CacheKeys, cacheGet, cacheSet } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const cacheKey = CacheKeys.adminResults();
    const cached = await cacheGet(cacheKey);
    if (cached) return ok(cached);

    await connectDB();

    const results = await Result.find({})
      .sort({ created_at: -1 })
      .limit(150)
      .select(
        'test_type score max_score accuracy_percent total_time_seconds created_at answers.flagged answers.selected_option answers.is_correct answers.question_id user_id test_id exam_id result_context'
      )
      .populate('user_id', 'name email')
      .populate('test_id', 'title')
      .populate('exam_id', 'name')
      .lean();

    const questionIds = results
      .filter((result: any) => result.test_type === 'daily_question')
      .map((result: any) => result.answers?.[0]?.question_id)
      .filter(Boolean);

    const questions = questionIds.length
      ? await Question.find({ _id: { $in: questionIds } })
          .select('question_text options correct_answer explanation subject_id')
          .populate('subject_id', 'name')
          .lean()
      : [];

    const questionMap = new Map(questions.map((question: any) => [String(question._id), question]));

    const data = results.map((result: any) => ({
      _id: String(result._id),
      test_type: result.test_type,
      score: result.score,
      max_score: result.max_score,
      accuracy_percent: result.accuracy_percent ?? 0,
      total_time_seconds: result.total_time_seconds,
      created_at: result.created_at,
      flagged_count: Array.isArray(result.answers)
        ? result.answers.filter((answer: any) => answer?.flagged).length
        : 0,
      user_id: result.user_id
        ? {
            _id: String(result.user_id._id),
            name: result.user_id.name,
            email: result.user_id.email,
          }
        : null,
      test_id: result.test_id
        ? {
            _id: String(result.test_id._id),
            title: result.test_id.title,
          }
        : null,
      exam_id: result.exam_id
        ? {
            _id: String(result.exam_id._id),
            name: result.exam_id.name,
          }
        : null,
      result_context: result.result_context
        ? {
            kind: result.result_context.kind ?? null,
            label: result.result_context.label ?? '',
            submitted_for_date: result.result_context.submitted_for_date ?? '',
          }
        : null,
      daily_question_preview:
        result.test_type === 'daily_question' && result.answers?.[0]?.question_id
          ? (() => {
              const answer = result.answers[0];
              const question = questionMap.get(String(answer.question_id));
              if (!question) return null;
              return {
                question_text: question.question_text,
                options: question.options ?? [],
                correct_answer: question.correct_answer,
                explanation: question.explanation ?? '',
                selected_option: answer.selected_option ?? null,
                is_correct: Boolean(answer.is_correct),
                subject_name: question.subject_id?.name ?? 'General',
              };
            })()
          : null,
    }));

    await cacheSet(cacheKey, data, 60);
    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
