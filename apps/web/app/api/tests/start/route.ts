import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, err, unauthorized, notFound, serverError } from '@/lib/apiResponse';
import { buildTestSession } from '@/lib/test-session';
import { connectDB } from '@/lib/db';
import { MockTest } from '@psc/shared/models';
import { validateScheduledWeeklyAttempt } from '@/lib/weekly-feed';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const body = await req.json();
    if (body?.weekly === 'scheduled') {
      await connectDB();
      const mock = await MockTest.findById(body.test_id).select('exam_id').lean() as any;
      if (!mock) return notFound('Mock test');
      const validation = await validateScheduledWeeklyAttempt({
        userId: session.user.id,
        testId: String(body.test_id),
        examId: String(mock.exam_id),
        weekEnd: body.week,
      });
      if (!validation.ok) return err(validation.error, validation.status);
    }

    const result = await buildTestSession(body);
    if (!result.ok) {
      if (result.status === 404) return notFound(result.error.replace(' not found', ''));
      return err(result.error, result.status);
    }

    return ok(result.data);
  } catch (e) {
    return serverError(e);
  }
}
