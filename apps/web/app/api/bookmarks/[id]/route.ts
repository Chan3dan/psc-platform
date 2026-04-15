import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Bookmark } from '@psc/shared/models';
import { ok, err, unauthorized, notFound, serverError } from '@/lib/apiResponse';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const { note = '' } = await req.json();
    if (typeof note !== 'string') return err('note must be a string');

    const updated = await Bookmark.findOneAndUpdate(
      { _id: params.id, user_id: session.user.id },
      { note },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return notFound('Bookmark');
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
