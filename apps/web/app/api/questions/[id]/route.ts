import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Question } from '@psc/shared/models';
import { ok, err, unauthorized, forbidden, notFound, serverError } from '@/lib/apiResponse';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const body = await req.json();
    if (!body?.question_text?.trim()) return err('question_text is required');
    if (!Array.isArray(body.options) || body.options.length !== 4) return err('exactly 4 options are required');
    if (typeof body.correct_answer !== 'number' || body.correct_answer < 0 || body.correct_answer > 3) {
      return err('correct_answer must be between 0 and 3');
    }

    await connectDB();
    const updated = await Question.findByIdAndUpdate(
      params.id,
      {
        question_text: body.question_text,
        options: body.options,
        correct_answer: body.correct_answer,
        explanation: body.explanation ?? '',
        difficulty: body.difficulty ?? 'medium',
        year: body.year ?? undefined,
        tags: Array.isArray(body.tags) ? body.tags : [],
      },
      { new: true, runValidators: true }
    )
      .populate('subject_id', 'name')
      .populate('exam_id', 'name')
      .lean();

    if (!updated) return notFound('Question');
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
