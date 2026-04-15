import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Question } from '@psc/shared/models';
import { ok, unauthorized, notFound, serverError } from '@/lib/apiResponse';

// GET /api/questions/[id]/answer
// Returns correct answer + explanation — only for authenticated users (practice mode)
// NEVER called during mock test — answers served at submit time only
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const q = await Question.findById(params.id)
      .select('correct_answer explanation')
      .lean() as any;

    if (!q) return notFound('Question');

    return ok({ correct_answer: q.correct_answer, explanation: q.explanation });
  } catch (e) {
    return serverError(e);
  }
}
