import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@psc/shared/models';
import { forbidden, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { CacheKeys, cacheGet, cacheSet } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const cacheKey = CacheKeys.adminUsers();
    const cached = await cacheGet(cacheKey);
    if (cached) return ok(cached);

    await connectDB();

    const users = await User.find({})
      .sort({ created_at: -1 })
      .limit(500)
      .select(
        'name email role stats.total_tests stats.average_accuracy stats.current_streak created_at is_active auth_provider'
      )
      .lean();

    const data = (users as any[]).map((user) => ({
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      is_active: user.is_active,
      auth_provider: user.auth_provider ?? 'email',
      stats: {
        total_tests: user.stats?.total_tests ?? 0,
        average_accuracy: user.stats?.average_accuracy ?? 0,
        current_streak: user.stats?.current_streak ?? 0,
      },
    }));

    await cacheSet(cacheKey, data, 60);
    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
