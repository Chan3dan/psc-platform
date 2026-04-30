import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result, StudyPlan, StudySession, User } from '@psc/shared/models';
import { err, notFound, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { updateStreak } from '@psc/shared/utils/planner';
import { CacheKeys, cacheDel } from '@/lib/redis';

type SubjectActivity = {
  attempts: number;
  minutes: number;
};

function getDayBounds(dateLike: Date | string) {
  const start = new Date(dateLike);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateLike);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildDayActivity(results: any[]) {
  const bySubject = new Map<string, SubjectActivity>();
  const mocks = results
    .filter((result) => result.test_type === 'mock')
    .map((result) => ({
      id: String(result._id),
      minutes: Math.max(0, Number(result.total_time_seconds ?? 0) / 60),
      questions: Number(result.correct_count ?? 0) + Number(result.wrong_count ?? 0) + Number(result.skipped_count ?? 0),
    }));

  for (const result of results) {
    for (const breakdown of result.subject_breakdown ?? []) {
      const subjectId = String(breakdown.subject_id ?? '');
      if (!subjectId) continue;
      const current = bySubject.get(subjectId) ?? { attempts: 0, minutes: 0 };
      const attempted = Number(breakdown.attempted ?? 0);
      const minutes = attempted > 0
        ? Number(breakdown.avg_time_per_question ?? 0) * attempted / 60
        : 0;
      current.attempts += attempted;
      current.minutes += minutes;
      bySubject.set(subjectId, current);
    }
  }

  return { bySubject, mocks };
}

function syncPlanDay(day: any, results: any[], sessions: any[] = []) {
  const { bySubject, mocks } = buildDayActivity(results);
  const sessionsBySlug = new Map<string, any>();
  for (const session of sessions) {
    const slug = String(session.topic_slug ?? '');
    if (!slug) continue;
    const current = sessionsBySlug.get(slug) ?? { duration_minutes: 0, completed: false };
    current.duration_minutes += Number(session.duration_minutes ?? 0);
    current.completed = current.completed || Boolean(session.completed);
    sessionsBySlug.set(slug, current);
  }
  const remainingBySubject = new Map<string, SubjectActivity>();
  const remainingMocks = [...mocks];

  for (const [subjectId, value] of bySubject.entries()) {
    remainingBySubject.set(subjectId, { ...value });
  }

  let verifiedQuestionCount = 0;
  let verifiedMinutes = 0;

  for (const task of day.tasks ?? []) {
    const verificationMode =
      task.verification_mode ?? (task.task_type === 'mock' ? 'mock' : 'questions');
    const requiredQuestions = Math.max(
      0,
      Number(task.minimum_questions ?? task.question_count ?? (task.task_type === 'mock' ? 0 : 5))
    );
    const requiredMinutes = Math.max(
      0,
      Number(task.minimum_minutes ?? Math.round(Number(task.duration_minutes ?? 0) * 0.6))
    );

    task.verified_questions = 0;
    task.verified_minutes = 0;
    task.verification_source = '';
    task.is_completed = false;
    task.completed_at = undefined;

    if (verificationMode === 'notes' || task.task_type === 'notes') {
      const slug = String(task.subject_slug ?? task.subject_name ?? '').toLowerCase().replace(/\s+/g, '-');
      const session = sessionsBySlug.get(slug) ?? { duration_minutes: 0, completed: false };
      const hasEnoughMinutes = requiredMinutes === 0 ? session.completed : session.duration_minutes >= requiredMinutes;
      task.verified_minutes = Math.max(0, Math.round(Number(session.duration_minutes ?? 0)));
      task.verification_source = hasEnoughMinutes || session.completed ? 'manual_notes_session' : '';
      if (hasEnoughMinutes || session.completed) {
        task.is_completed = true;
        task.completed_at = new Date();
      }
    } else if (verificationMode === 'mock' || task.task_type === 'mock') {
      const matchIndex = remainingMocks.findIndex((mock) => mock.minutes >= requiredMinutes || mock.questions >= 1);
      if (matchIndex >= 0) {
        const match = remainingMocks.splice(matchIndex, 1)[0];
        task.verified_questions = match.questions;
        task.verified_minutes = Math.round(match.minutes);
        task.verification_source = 'mock_attempt';
        task.is_completed = true;
        task.completed_at = new Date();
      }
    } else {
      const subjectId = String(task.subject_id ?? '');
      const activity = remainingBySubject.get(subjectId) ?? { attempts: 0, minutes: 0 };
      const usableQuestions = Math.min(activity.attempts, requiredQuestions > 0 ? requiredQuestions : activity.attempts);
      const usableMinutes = Math.min(activity.minutes, requiredMinutes > 0 ? requiredMinutes : activity.minutes);
      const hasEnoughQuestions = requiredQuestions === 0 ? activity.attempts > 0 : activity.attempts >= requiredQuestions;
      const hasEnoughMinutes = requiredMinutes === 0 ? true : activity.minutes >= requiredMinutes;

      task.verified_questions = Math.max(0, Math.round(usableQuestions));
      task.verified_minutes = Math.max(0, Math.round(usableMinutes));
      task.verification_source = hasEnoughQuestions || hasEnoughMinutes ? 'real_activity' : '';

      if (hasEnoughQuestions) {
        task.is_completed = true;
        task.completed_at = new Date();
        activity.attempts = Math.max(0, activity.attempts - Math.max(1, requiredQuestions));
        activity.minutes = Math.max(0, activity.minutes - requiredMinutes);
      } else {
        activity.attempts = Math.max(0, activity.attempts - usableQuestions);
        activity.minutes = Math.max(0, activity.minutes - usableMinutes);
      }

      remainingBySubject.set(subjectId, activity);
    }

    verifiedQuestionCount += Number(task.verified_questions ?? 0);
    verifiedMinutes += Number(task.verified_minutes ?? 0);
  }

  day.verified_question_count = verifiedQuestionCount;
  day.verified_minutes = verifiedMinutes;
  day.is_completed = Boolean(day.tasks?.length) && day.tasks.every((task: any) => task.is_completed);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const dayIndex = typeof body?.day_index === 'number' ? body.day_index : null;

    const plan = await StudyPlan.findOne({
      _id: params.id,
      user_id: session.user.id,
    });
    if (!plan) return notFound('Study plan');

    const dailySchedule = Array.isArray(plan.daily_schedule) ? plan.daily_schedule : [];
    if (!dailySchedule.length) return err('No schedule found for this plan', 404);

    const selectedDays =
      dayIndex === null
        ? dailySchedule.map((_: any, index: number) => index)
        : [dayIndex];

    const invalidIndex = selectedDays.find((index: number) => index < 0 || index >= dailySchedule.length);
    if (typeof invalidIndex === 'number') {
      return err('Day not found', 404);
    }

    const windows = selectedDays.map((index: number) => getDayBounds(dailySchedule[index].date));
    const overallStart = windows.reduce((min: Date, item: { start: Date }) => (item.start < min ? item.start : min), windows[0].start);
    const overallEnd = windows.reduce((max: Date, item: { end: Date }) => (item.end > max ? item.end : max), windows[0].end);

    const [results, sessions] = await Promise.all([
      Result.find({
        user_id: session.user.id,
        exam_id: plan.exam_id,
        created_at: { $gte: overallStart, $lte: overallEnd },
      })
        .select(
          '_id test_type created_at total_time_seconds correct_count wrong_count skipped_count subject_breakdown'
        )
        .lean(),
      StudySession.find({
        user_id: session.user.id,
        date: { $gte: overallStart, $lte: overallEnd },
      }).lean(),
    ]);

    const resultsByDay = new Map<string, any[]>();
    for (const result of results) {
      const key = new Date(result.created_at).toDateString();
      const list = resultsByDay.get(key) ?? [];
      list.push(result);
      resultsByDay.set(key, list);
    }
    const sessionsByDay = new Map<string, any[]>();
    for (const item of sessions) {
      const key = new Date(item.date).toDateString();
      const list = sessionsByDay.get(key) ?? [];
      list.push(item);
      sessionsByDay.set(key, list);
    }

    const todayKey = new Date().toDateString();
    let completedTodayNow = false;
    let completedTodayBefore = false;

    for (const index of selectedDays) {
      const day = dailySchedule[index];
      const key = new Date(day.date).toDateString();
      if (key === todayKey) completedTodayBefore = Boolean(day.is_completed);
      syncPlanDay(day, resultsByDay.get(key) ?? [], sessionsByDay.get(key) ?? []);
      if (key === todayKey) completedTodayNow = Boolean(day.is_completed);
    }

    if (completedTodayNow && !completedTodayBefore) {
      const { new_streak } = updateStreak(plan.last_active_date, plan.streak_days);
      plan.streak_days = new_streak;
      plan.last_active_date = new Date();

      const dbUser = await User.findById(session.user.id).select('stats').lean() as any;
      await User.findByIdAndUpdate(session.user.id, {
        $set: {
          'stats.current_streak': new_streak,
          'stats.last_active': new Date(),
          ...(new_streak > (dbUser?.stats?.longest_streak ?? 0)
            ? { 'stats.longest_streak': new_streak }
            : {}),
        },
      });
    }

    await plan.save();
    await cacheDel(CacheKeys.dashboardSummary(session.user.id));

    return ok({
      ...plan.toJSON(),
      verification_mode: 'strict',
      synced_range: dayIndex === null ? 'all' : 'single_day',
    });
  } catch (error) {
    return serverError(error);
  }
}
