import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result, StudyPlan, User } from '@psc/shared/models';
import { generateAnalytics } from '@psc/shared/utils/analytics';
import { ok, serverError, unauthorized } from '@/lib/apiResponse';
import { CacheKeys, cacheGet, cacheSet } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const userId = session.user.id;
    const cacheKey = CacheKeys.dashboardSummary(userId);
    const cached = await cacheGet(cacheKey);
    if (cached) return ok(cached);

    await connectDB();

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [results, user, plan, drillsToday] = await Promise.all([
      Result.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(20)
        .select(
          'score max_score accuracy_percent correct_count wrong_count skipped_count total_time_seconds created_at subject_breakdown answers.time_spent_seconds test_id'
        )
        .populate('test_id', 'title')
        .lean(),
      User.findById(userId).select('name stats').lean(),
      StudyPlan.findOne({ user_id: userId, is_active: true })
        .select('exam_id streak_days target_date')
        .populate('exam_id', 'name')
        .lean(),
      Result.countDocuments({
        user_id: userId,
        test_type: 'practice',
        created_at: { $gte: start, $lte: end },
        total_time_seconds: { $lte: 300 },
      }),
    ]);

    const analytics = generateAnalytics(results as any);

    const data = {
      analytics,
      user: user
        ? {
            name: (user as any).name ?? '',
            stats: (user as any).stats ?? {},
          }
        : null,
      plan: plan
        ? {
            examName: (plan as any).exam_id?.name ?? '',
            streakDays: (plan as any).streak_days ?? 0,
            targetDate: (plan as any).target_date ?? null,
          }
        : null,
      drillsToday,
      recentResults: (results as any[]).slice(0, 5).map((result) => ({
        _id: String(result._id),
        title: result.test_id?.title ?? 'Practice Session',
        score: result.score,
        maxScore: result.max_score,
        correctCount: result.correct_count,
        wrongCount: result.wrong_count,
        skippedCount: result.skipped_count,
        totalTimeSeconds: result.total_time_seconds,
        createdAt: result.created_at,
      })),
    };

    await cacheSet(cacheKey, data, 90);
    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
