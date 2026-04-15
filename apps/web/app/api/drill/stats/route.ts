import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ok, unauthorized, serverError } from '@/lib/apiResponse';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const rolling24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const todayCount = await Result.countDocuments({
      user_id: session.user.id,
      test_type: 'practice',
      created_at: { $gte: rolling24h },
      total_time_seconds: { $lte: 360 },
      'answers.4': { $exists: true },
      'answers.5': { $exists: false },
    });

    return ok({ drills_today: todayCount });
  } catch (e) {
    return serverError(e);
  }
}
