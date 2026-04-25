import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { err, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { Feedback } from '@psc/shared/models';

const ALLOWED_STATUSES = new Set(['new', 'reviewing', 'planned', 'resolved', 'closed']);

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return err('Invalid request body');

    const update: Record<string, unknown> = {};
    if ('status' in body) {
      const status = String((body as any).status ?? '').trim();
      if (!ALLOWED_STATUSES.has(status)) return err('Invalid feedback status');
      update.status = status;
    }
    if ('admin_note' in body) {
      update.admin_note = String((body as any).admin_note ?? '').trim();
    }

    if (Object.keys(update).length === 0) return err('No changes received');

    await connectDB();
    const entry = await Feedback.findByIdAndUpdate(params.id, { $set: update }, { new: true }).lean() as any;
    if (!entry) return notFound('Feedback');

    return ok({
      _id: String(entry._id),
      status: entry.status,
      admin_note: entry.admin_note ?? '',
      updated_at: entry.updated_at,
    });
  } catch (error) {
    return serverError(error);
  }
}
