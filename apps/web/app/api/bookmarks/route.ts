import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Bookmark } from '@psc/shared/models';
import { ok, created, err, unauthorized, serverError } from '@/lib/apiResponse';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const bookmarks = await Bookmark.find({ user_id: session.user.id })
      .populate({
        path: 'question_id',
        select: 'question_text options correct_answer explanation subject_id exam_id difficulty',
        populate: [
          { path: 'subject_id', select: 'name' },
          { path: 'exam_id', select: 'name slug' },
        ],
      })
      .sort({ created_at: -1 })
      .lean();

    return ok(bookmarks);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const { question_id, note = '' } = await req.json();
    if (!question_id) return err('question_id is required');

    try {
      const bookmark = await Bookmark.create({
        user_id: session.user.id,
        question_id,
        note,
      });
      return created(bookmark);
    } catch (e: any) {
      if (e.code === 11000) return err('Question already bookmarked', 409);
      throw e;
    }
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const { question_id } = await req.json();
    if (!question_id) return err('question_id is required');

    await Bookmark.deleteOne({ user_id: session.user.id, question_id });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
