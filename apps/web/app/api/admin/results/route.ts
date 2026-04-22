import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
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
        'test_type score max_score total_time_seconds created_at answers.flagged user_id test_id exam_id'
      )
      .populate('user_id', 'name email')
      .populate('test_id', 'title')
      .populate('exam_id', 'name')
      .lean();

    const data = results.map((result: any) => ({
      _id: String(result._id),
      test_type: result.test_type,
      score: result.score,
      max_score: result.max_score,
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
    }));

    await cacheSet(cacheKey, data, 60);
    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
