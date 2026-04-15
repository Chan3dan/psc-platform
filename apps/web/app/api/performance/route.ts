import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ok, unauthorized, serverError } from '@/lib/apiResponse';
import { generateAnalytics } from '@psc/shared/utils/analytics';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const { searchParams } = req.nextUrl;
    const exam_id = searchParams.get('exam_id');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100);

    const cacheKey = CacheKeys.performance(session.user.id, exam_id ?? undefined);
    const cached = await cacheGet(cacheKey);
    if (cached) return ok(cached);

    await connectDB();

    const filter: Record<string, unknown> = { user_id: session.user.id };
    if (exam_id) filter.exam_id = exam_id;

    const results = await Result.find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('test_id', 'title')
      .lean();

    const analytics = generateAnalytics(results as any);
    await cacheSet(cacheKey, analytics, 120); // 2 min cache

    return ok(analytics);
  } catch (e) {
    return serverError(e);
  }
}
