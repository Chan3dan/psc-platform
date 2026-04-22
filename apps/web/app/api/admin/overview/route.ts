import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Question, Result, User } from '@psc/shared/models';
import { forbidden, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { CacheKeys, cacheGet, cacheSet } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const cacheKey = CacheKeys.adminOverview();
    const cached = await cacheGet(cacheKey);
    if (cached) return ok(cached);

    await connectDB();

    const [examCount, questionCount, userCount, resultCount, recentUsers, flaggedCountAgg, recentFlaggedResults] =
      await Promise.all([
        Exam.countDocuments({ is_active: true }),
        Question.countDocuments({ is_active: true }),
        User.countDocuments({ is_active: true }),
        Result.countDocuments({}),
        User.find({})
          .sort({ created_at: -1 })
          .limit(8)
          .select('name email created_at role')
          .lean(),
        Result.aggregate([{ $unwind: '$answers' }, { $match: { 'answers.flagged': true } }, { $count: 'total' }]),
        Result.find({ 'answers.flagged': true })
          .sort({ created_at: -1 })
          .limit(8)
          .select('answers.flagged answers.question_id user_id test_id created_at')
          .populate('user_id', 'name email')
          .populate('test_id', 'title')
          .populate({ path: 'answers.question_id', model: 'Question', select: 'question_text' })
          .lean(),
      ]);

    const recentFlaggedQuestions = (recentFlaggedResults as any[])
      .flatMap((result) =>
        (result.answers ?? [])
          .filter((answer: any) => answer.flagged && answer.question_id)
          .map((answer: any) => ({
            resultId: String(result._id),
            questionId: String(answer.question_id?._id ?? ''),
            questionText: answer.question_id?.question_text ?? 'Question text unavailable',
            userName: result.user_id?.name ?? 'Unknown user',
            testTitle: result.test_id?.title ?? 'Practice Session',
            createdAt: result.created_at,
          }))
      )
      .slice(0, 6);

    const data = {
      stats: {
        examCount,
        questionCount,
        userCount,
        resultCount,
        flaggedCount: flaggedCountAgg[0]?.total ?? 0,
      },
      recentUsers: (recentUsers as any[]).map((user) => ({
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      })),
      recentFlaggedQuestions,
    };

    await cacheSet(cacheKey, data, 60);
    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
