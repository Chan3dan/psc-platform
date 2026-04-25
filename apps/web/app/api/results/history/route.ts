import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ok, serverError, unauthorized } from '@/lib/apiResponse';
import { CacheKeys, cacheGet, cacheSet } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const userId = session.user.id;
    const cacheKey = CacheKeys.resultsHistory(userId);
    const cached = await cacheGet(cacheKey);
    if (cached) return ok(cached);

    await connectDB();

    const results = await Result.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(150)
      .select(
        'test_type score max_score accuracy_percent total_time_seconds correct_count wrong_count skipped_count created_at exam_id test_id answers.flagged result_context'
      )
      .populate('test_id', 'title')
      .populate('exam_id', 'name')
      .lean();

    const data = results.map((result: any) => ({
      _id: String(result._id),
      test_type: result.test_type,
      score: result.score,
      max_score: result.max_score,
      accuracy_percent: result.accuracy_percent,
      total_time_seconds: result.total_time_seconds,
      correct_count: result.correct_count,
      wrong_count: result.wrong_count,
      skipped_count: result.skipped_count,
      created_at: result.created_at,
      exam_id: result.exam_id
        ? {
            _id: String(result.exam_id._id),
            name: result.exam_id.name,
          }
        : null,
      test_id: result.test_id
        ? {
            _id: String(result.test_id._id),
            title: result.test_id.title,
          }
        : null,
      flagged_count: Array.isArray(result.answers)
        ? result.answers.filter((answer: any) => answer?.flagged).length
        : 0,
      result_context: result.result_context
        ? {
            kind: result.result_context.kind ?? null,
            label: result.result_context.label ?? '',
            submitted_for_date: result.result_context.submitted_for_date ?? '',
          }
        : null,
    }));

    await cacheSet(cacheKey, data, 90);
    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
