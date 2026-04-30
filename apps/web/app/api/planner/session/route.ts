import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { RevisionLog, StudySession, User } from '@psc/shared/models';
import { ok, err, serverError, unauthorized } from '@/lib/apiResponse';
import { getDayBounds, getNextRevisionDate, getPlannerTodayPayload } from '@/lib/planner-smart';
import { updateStreak } from '@psc/shared/utils/planner';
import { CacheKeys, cacheDel } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const body = await req.json();
    const topicSlug = String(body.topicSlug ?? body.topic_slug ?? '').trim();
    const topicName = String(body.topicName ?? body.topic_name ?? topicSlug).trim();
    const durationMinutes = Math.max(0, Math.round(Number(body.durationMinutes ?? body.duration_minutes ?? 0)));
    const completed = Boolean(body.completed);

    if (!topicSlug) return err('topicSlug is required');
    if (!topicName) return err('topicName is required');

    const { start } = getDayBounds();
    const now = new Date();
    const user = await User.findById(session.user.id).select('stats').lean() as any;
    const { new_streak } = completed
      ? updateStreak(user?.stats?.last_active, Number(user?.stats?.current_streak ?? 0))
      : { new_streak: Number(user?.stats?.current_streak ?? 0) };

    await StudySession.findOneAndUpdate(
      {
        user_id: session.user.id,
        date: start,
        topic_slug: topicSlug,
      },
      {
        $set: {
          exam_id: body.examId ?? body.exam_id,
          subject_id: body.subjectId ?? body.subject_id,
          topic_name: topicName,
          completed,
          date: start,
        },
        $inc: {
          duration_minutes: durationMinutes,
        },
      },
      { upsert: true, new: true }
    );

    if (completed) {
      await RevisionLog.findOneAndUpdate(
        {
          user_id: session.user.id,
          exam_id: body.examId ?? body.exam_id,
          topic_slug: topicSlug,
        },
        {
          $setOnInsert: {
            user_id: session.user.id,
            revision_count: 0,
          },
          $set: {
            subject_id: body.subjectId ?? body.subject_id,
            topic_name: topicName,
            last_studied: now,
            next_revision: getNextRevisionDate(1, now),
          },
          $push: {
            history: {
              date: now,
              action: 'studied',
              duration_minutes: durationMinutes,
            },
          },
        },
        { upsert: true }
      );

      await User.findByIdAndUpdate(session.user.id, {
        $set: {
          'stats.current_streak': new_streak,
          'stats.last_active': now,
          ...(new_streak > Number(user?.stats?.longest_streak ?? 0)
            ? { 'stats.longest_streak': new_streak }
            : {}),
        },
      });
      await cacheDel(CacheKeys.dashboardSummary(session.user.id));
    }

    const payload = await getPlannerTodayPayload(session.user.id);
    return ok(payload);
  } catch (error) {
    return serverError(error);
  }
}
