import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { RevisionLog } from '@psc/shared/models';
import { ok, err, serverError, unauthorized } from '@/lib/apiResponse';
import { getNextRevisionDate, getPlannerTodayPayload } from '@/lib/planner-smart';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const body = await req.json();
    const topicSlug = String(body.topicSlug ?? body.topic_slug ?? '').trim();
    const topicName = String(body.topicName ?? body.topic_name ?? topicSlug).trim();
    const examId = body.examId ?? body.exam_id;
    const subjectId = body.subjectId ?? body.subject_id;

    if (!topicSlug) return err('topicSlug is required');
    if (!examId) return err('examId is required');

    const existing = await RevisionLog.findOne({
      user_id: session.user.id,
      exam_id: examId,
      topic_slug: topicSlug,
    }).lean() as any;
    const revisionCount = Number(existing?.revision_count ?? 0) + 1;
    const now = new Date();

    await RevisionLog.findOneAndUpdate(
      {
        user_id: session.user.id,
        exam_id: examId,
        topic_slug: topicSlug,
      },
      {
        $setOnInsert: {
          user_id: session.user.id,
          exam_id: examId,
          topic_slug: topicSlug,
        },
        $set: {
          subject_id: subjectId,
          topic_name: topicName,
          last_studied: now,
          next_revision: getNextRevisionDate(revisionCount, now),
          revision_count: revisionCount,
        },
        $push: {
          history: {
            date: now,
            action: 'revised',
          },
        },
      },
      { upsert: true }
    );

    const payload = await getPlannerTodayPayload(session.user.id);
    return ok(payload);
  } catch (error) {
    return serverError(error);
  }
}
