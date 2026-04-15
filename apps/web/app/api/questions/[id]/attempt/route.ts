import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Question } from '@psc/shared/models';
import { ok, unauthorized, serverError } from '@/lib/apiResponse';

// POST /api/questions/[id]/attempt
// Non-blocking stat update for practice mode
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const { selected_option } = await req.json();

    const q = await Question.findById(params.id).select('correct_answer').lean() as any;
    if (!q) return ok({ recorded: false });

    const is_correct = selected_option === q.correct_answer;
    await Question.findByIdAndUpdate(params.id, {
      $inc: {
        attempt_count: 1,
        ...(is_correct ? { correct_count: 1 } : {}),
      },
    });

    return ok({ recorded: true, is_correct });
  } catch (e) {
    return serverError(e);
  }
}
