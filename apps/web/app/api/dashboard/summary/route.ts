import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Result, StudyPlan, User } from '@psc/shared/models';
import { generateAnalytics } from '@psc/shared/utils/analytics';
import { ok, serverError, unauthorized } from '@/lib/apiResponse';
import { CacheKeys, cacheGet, cacheSet } from '@/lib/redis';
import { UPCOMING_EXAM_TRACKS } from '@/lib/exam-tracks';

export const dynamic = 'force-dynamic';

function getReviewCount(results: any[]) {
  const seen = new Set<string>();
  for (const result of results) {
    for (const answer of result.answers ?? []) {
      const questionId = String(answer?.question_id ?? '');
      if (!questionId) continue;
      if (answer?.flagged || answer?.selected_option === null || answer?.is_correct === false) {
        seen.add(questionId);
      }
    }
  }
  return seen.size;
}

function getWeeklyMockCount(results: any[]) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  return results.filter((result) => result.test_type === 'mock' && new Date(result.created_at) >= weekStart).length;
}

function buildReadinessScore(analytics: any, results: any[], reviewCount: number, streak: number) {
  const avgAccuracy = Number(analytics.overall_accuracy ?? analytics.avg_score_percent ?? 0);
  const testVolume = Math.min(results.length, 10) / 10;
  const consistency = Math.min(streak, 7) / 7;
  const reviewHealth = reviewCount === 0 ? 1 : Math.max(0, 1 - reviewCount / 40);
  const mockQuality = results.some((result) => result.test_type === 'mock') ? 1 : 0.35;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(avgAccuracy * 0.5 + testVolume * 15 + consistency * 15 + reviewHealth * 10 + mockQuality * 10)
    )
  );
}

function buildDailyMissions({
  drillsToday,
  reviewCount,
  weeklyMockCount,
}: {
  drillsToday: number;
  reviewCount: number;
  weeklyMockCount: number;
}) {
  return [
    {
      id: 'daily-challenge',
      title: 'Complete today’s 5-minute challenge',
      description: 'Finish one speed drill to keep your learning streak active.',
      href: '/drill',
      cta: drillsToday > 0 ? 'Completed' : 'Start challenge',
      completed: drillsToday > 0,
      progress: Math.min(100, drillsToday * 100),
      type: 'challenge',
    },
    {
      id: 'smart-review',
      title: 'Review 10 score-leak questions',
      description: reviewCount > 0 ? `${reviewCount} wrong, skipped, or flagged questions need attention.` : 'Your review queue is clear today.',
      href: '/review',
      cta: reviewCount > 0 ? 'Open review queue' : 'Review clear',
      completed: reviewCount === 0,
      progress: reviewCount === 0 ? 100 : Math.max(10, Math.min(90, Math.round(((10 - Math.min(reviewCount, 10)) / 10) * 100))),
      type: 'review',
    },
    {
      id: 'weekly-mock',
      title: 'Take one full mock this week',
      description: weeklyMockCount > 0 ? `${weeklyMockCount} mock completed in the last 7 days.` : 'A full mock keeps exam pressure familiar.',
      href: '/mock',
      cta: weeklyMockCount > 0 ? 'Completed' : 'Take mock',
      completed: weeklyMockCount > 0,
      progress: weeklyMockCount > 0 ? 100 : 0,
      type: 'mock',
    },
  ];
}

function buildMilestones(analytics: any, results: any[], readinessScore: number, streak: number) {
  const totalQuestions = Number(analytics.total_questions ?? 0);
  return [
    {
      label: 'First mock completed',
      completed: results.some((result) => result.test_type === 'mock'),
    },
    {
      label: '100 questions solved',
      completed: totalQuestions >= 100,
      progress: Math.min(100, totalQuestions),
    },
    {
      label: '7-day learning streak',
      completed: streak >= 7,
      progress: Math.min(100, Math.round((streak / 7) * 100)),
    },
    {
      label: '70% readiness score',
      completed: readinessScore >= 70,
      progress: Math.min(100, Math.round((readinessScore / 70) * 100)),
    },
  ];
}

function buildDailyFeed({
  preferredExam,
  plan,
  reviewQueueCount,
}: {
  preferredExam: any;
  plan: any;
  reviewQueueCount: number;
}) {
  const feed = [];

  feed.push({
    id: 'question-of-day',
    type: 'question',
    title: 'Question of the day',
    body: `Open your ${preferredExam?.name ?? 'exam'} feed for today’s focused question and study updates.`,
    href: '/feed',
    status: 'Open feed',
  });

  feed.push({
    id: 'weekly-mock-feed',
    type: 'mock',
    title: 'Weekly mock test',
    body: 'Your weekly exam-style mock and published rank updates now live in Newsfeed.',
    href: '/feed',
    status: 'Open weekly test',
  });

  if (plan) {
    feed.push({
      id: 'study-plan',
      type: 'planner',
      title: `${plan.verifiedDays}/${plan.totalDays} plan days verified`,
      body:
        plan.overdueDays > 0
          ? `${plan.overdueDays} past day${plan.overdueDays > 1 ? 's are' : ' is'} still unverified.`
          : 'Your current study plan is staying on track.',
      href: '/planner',
      status: `${plan.complianceScore}% compliance`,
    });
  }

  feed.push({
    id: 'review-queue',
    type: 'review',
    title: reviewQueueCount > 0 ? 'Review backlog needs attention' : 'Review queue is clear',
    body:
      reviewQueueCount > 0
        ? `${reviewQueueCount} flagged, wrong, or skipped questions are ready for revision.`
        : 'No urgent review leaks detected right now.',
    href: '/review',
    status: reviewQueueCount > 0 ? 'Open review' : 'Healthy',
  });

  return feed;
}

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

    const user = (await User.findById(userId)
      .select('name stats preferences')
      .populate('preferences.target_exam_id', 'name slug description')
      .lean()) as any;

    const targetExamId = user?.preferences?.target_exam_id?._id
      ? String(user.preferences.target_exam_id._id)
      : null;

    const resultFilter: Record<string, unknown> = { user_id: userId };
    if (targetExamId) {
      resultFilter.exam_id = targetExamId;
    }

    const [results, plan, drillsToday, activeExams] = await Promise.all([
      Result.find(resultFilter)
        .sort({ created_at: -1 })
        .limit(20)
        .select(
          'test_type score max_score accuracy_percent correct_count wrong_count skipped_count total_time_seconds created_at subject_breakdown answers.question_id answers.selected_option answers.is_correct answers.flagged answers.time_spent_seconds test_id result_context'
        )
        .populate('test_id', 'title')
        .lean(),
      StudyPlan.findOne({ user_id: userId, is_active: true })
        .select('exam_id streak_days target_date daily_schedule')
        .populate('exam_id', 'name')
        .lean(),
      Result.countDocuments({
        user_id: userId,
        ...(targetExamId ? { exam_id: targetExamId } : {}),
        test_type: 'practice',
        created_at: { $gte: start, $lte: end },
        total_time_seconds: { $lte: 300 },
      }),
      Exam.find({ is_active: true }).select('name slug description').sort({ name: 1 }).lean(),
    ]);

    const analytics = generateAnalytics(results as any);
    const streak = (user as any)?.stats?.current_streak ?? 0;
    const reviewQueueCount = getReviewCount(results as any[]);
    const weeklyMockCount = getWeeklyMockCount(results as any[]);
    const readinessScore = buildReadinessScore(analytics, results as any[], reviewQueueCount, streak);
    const dailyMissions = buildDailyMissions({ drillsToday, reviewCount: reviewQueueCount, weeklyMockCount });
    const milestones = buildMilestones(analytics, results as any[], readinessScore, streak);
    const preferredExam = targetExamId
      ? {
          _id: targetExamId,
          name: user.preferences.target_exam_id.name,
          slug: user.preferences.target_exam_id.slug,
          description: user.preferences.target_exam_id.description ?? '',
        }
      : null;
    const planSummary = plan
      ? {
          examName: (plan as any).exam_id?.name ?? '',
          streakDays: (plan as any).streak_days ?? 0,
          targetDate: (plan as any).target_date ?? null,
          totalDays: Array.isArray((plan as any).daily_schedule) ? (plan as any).daily_schedule.length : 0,
          verifiedDays: Array.isArray((plan as any).daily_schedule)
            ? (plan as any).daily_schedule.filter((item: any) => item.is_completed).length
            : 0,
          overdueDays: Array.isArray((plan as any).daily_schedule)
            ? (plan as any).daily_schedule.filter((item: any) => new Date(item.date) < start && !item.is_completed).length
            : 0,
          complianceScore: Array.isArray((plan as any).daily_schedule) && (plan as any).daily_schedule.length > 0
            ? Math.round(
                ((plan as any).daily_schedule.filter((item: any) => item.is_completed).length / (plan as any).daily_schedule.length) * 100
              )
            : 0,
        }
      : null;
    const dailyFeed = buildDailyFeed({
      preferredExam,
      plan: planSummary,
      reviewQueueCount,
    });

    const data = {
      analytics,
      engagement: {
        readinessScore,
        reviewQueueCount,
        weeklyMockCount,
        dailyMissions,
        milestones,
        dailyFeed,
        dailyChallenge: {
          title: 'Daily 5-minute challenge',
          completedToday: drillsToday > 0,
          href: '/drill',
        },
      },
      user: user
        ? {
            name: (user as any).name ?? '',
            stats: (user as any).stats ?? {},
            preferences: {
              language: (user as any)?.preferences?.language === 'ne' ? 'ne' : 'en',
            },
          }
        : null,
      preferredExam,
      activeExams: (activeExams as any[]).map((exam) => ({
        _id: String(exam._id),
        name: exam.name,
        slug: exam.slug,
        description: exam.description ?? '',
      })),
      examTracks: UPCOMING_EXAM_TRACKS,
      plan: planSummary,
      drillsToday,
      recentResults: (results as any[]).slice(0, 5).map((result) => ({
        _id: String(result._id),
        title: result.test_id?.title ?? result.result_context?.label ?? 'Practice Session',
        testType: result.test_type,
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
