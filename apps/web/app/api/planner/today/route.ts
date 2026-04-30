import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getPlannerTodayPayload } from '@/lib/planner-smart';
import { ok, serverError, unauthorized } from '@/lib/apiResponse';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const payload = await getPlannerTodayPayload(session.user.id);
    return ok(payload);
  } catch (error) {
    return serverError(error);
  }
}
