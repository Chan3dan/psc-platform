import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { err, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { Exam, User } from '@psc/shared/models';
import { UPCOMING_EXAM_TRACKS } from '@/lib/exam-tracks';
import { CacheKeys, cacheDel } from '@/lib/redis';

export const dynamic = 'force-dynamic';

function normalizeLanguage(value: unknown) {
  return value === 'ne' ? 'ne' : 'en';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();

    const [user, exams] = await Promise.all([
      User.findById(session.user.id)
        .select('name email preferences')
        .populate('preferences.target_exam_id', 'name slug description')
        .lean() as Promise<any>,
      Exam.find({ is_active: true })
        .select('_id name slug description')
        .sort({ name: 1 })
        .lean(),
    ]);

    return ok({
      name: user?.name ?? '',
      email: user?.email ?? '',
      preferences: {
        targetExam: user?.preferences?.target_exam_id
          ? {
              _id: String(user.preferences.target_exam_id._id),
              name: user.preferences.target_exam_id.name,
              slug: user.preferences.target_exam_id.slug,
              description: user.preferences.target_exam_id.description ?? '',
            }
          : null,
        language: normalizeLanguage(user?.preferences?.language),
      },
      activeExams: exams.map((exam: any) => ({
        _id: String(exam._id),
        name: exam.name,
        slug: exam.slug,
        description: exam.description ?? '',
      })),
      examTracks: UPCOMING_EXAM_TRACKS,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return err('Invalid request body');

    const nextUpdate: Record<string, unknown> = {};

    if ('language' in body) {
      nextUpdate['preferences.language'] = normalizeLanguage((body as any).language);
    }

    if ('target_exam_id' in body) {
      const targetExamId = (body as any).target_exam_id;
      if (!targetExamId) {
        nextUpdate['preferences.target_exam_id'] = null;
      } else {
        await connectDB();
        const exam = await Exam.findOne({ _id: targetExamId, is_active: true }).select('_id');
        if (!exam) return err('Selected exam is not available', 404);
        nextUpdate['preferences.target_exam_id'] = exam._id;
      }
    }

    if (Object.keys(nextUpdate).length === 0) {
      return err('No preference changes received');
    }

    await connectDB();
    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: nextUpdate },
      { new: true }
    )
      .select('preferences')
      .populate('preferences.target_exam_id', 'name slug description')
      .lean() as any;

    await cacheDel(CacheKeys.dashboardSummary(session.user.id));

    return ok({
      targetExam: updated?.preferences?.target_exam_id
        ? {
            _id: String(updated.preferences.target_exam_id._id),
            name: updated.preferences.target_exam_id.name,
            slug: updated.preferences.target_exam_id.slug,
            description: updated.preferences.target_exam_id.description ?? '',
          }
        : null,
      language: normalizeLanguage(updated?.preferences?.language),
    });
  } catch (error) {
    return serverError(error);
  }
}
