import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { forbidden, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { Feedback } from '@psc/shared/models';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim();
    const category = searchParams.get('category')?.trim();
    const query = searchParams.get('q')?.trim();

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { exam_name: { $regex: query, $options: 'i' } },
        { exam_slug: { $regex: query, $options: 'i' } },
        { message: { $regex: query, $options: 'i' } },
      ];
    }

    await connectDB();
    const entries = await Feedback.find(filter)
      .sort({ created_at: -1 })
      .lean();

    return ok(
      entries.map((entry: any) => ({
        _id: String(entry._id),
        name: entry.name,
        email: entry.email,
        category: entry.category,
        exam_slug: entry.exam_slug ?? '',
        exam_name: entry.exam_name ?? '',
        message: entry.message,
        status: entry.status,
        admin_note: entry.admin_note ?? '',
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      }))
    );
  } catch (error) {
    return serverError(error);
  }
}
