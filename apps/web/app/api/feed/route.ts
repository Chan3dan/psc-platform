import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@psc/shared/models';
import { ok, serverError, unauthorized } from '@/lib/apiResponse';
import { buildWeeklyFeedForExam } from '@/lib/weekly-feed';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();

    const user = await User.findById(session.user.id)
      .select('preferences.target_exam_id')
      .populate('preferences.target_exam_id', 'name slug')
      .lean() as any;

    const exam = user?.preferences?.target_exam_id ?? null;
    const weekly = await buildWeeklyFeedForExam(exam);

    return ok({
      exam: exam
        ? {
            _id: String(exam._id),
            name: exam.name,
            slug: exam.slug,
          }
        : null,
      weekly,
    });
  } catch (error) {
    return serverError(error);
  }
}
