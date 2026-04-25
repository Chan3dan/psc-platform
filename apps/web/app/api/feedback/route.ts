import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { created, err, ok, serverError } from '@/lib/apiResponse';
import { Feedback, User } from '@psc/shared/models';

const ALLOWED_CATEGORIES = new Set(['general', 'bug', 'feature', 'exam_request']);

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({
    categories: Array.from(ALLOWED_CATEGORIES),
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') return err('Invalid request body');

    const category = String((body as any).category ?? 'general');
    if (!ALLOWED_CATEGORIES.has(category)) return err('Unsupported feedback category');

    await connectDB();

    let fallbackName = '';
    let fallbackEmail = '';
    if (session?.user?.id) {
      const user = (await User.findById(session.user.id).select('name email').lean()) as any;
      fallbackName = user?.name ?? '';
      fallbackEmail = user?.email ?? '';
    }

    const providedName = String((body as any).name ?? '').trim();
    const providedEmail = String((body as any).email ?? '').trim().toLowerCase();
    const name = providedName || fallbackName;
    const email = providedEmail || fallbackEmail;
    const message = String((body as any).message ?? '').trim();
    const examSlug = String((body as any).exam_slug ?? '').trim().toLowerCase();
    const examName = String((body as any).exam_name ?? '').trim();

    if (!name) return err('Name is required');
    if (!email || !email.includes('@')) return err('A valid email is required');
    if (message.length < 10) return err('Please enter a little more detail');

    const entry = await Feedback.create({
      user_id: session?.user?.id ?? undefined,
      name,
      email,
      category,
      exam_slug: examSlug || undefined,
      exam_name: examName || undefined,
      message,
    });

    return created({
      _id: String(entry._id),
      status: entry.status,
    });
  } catch (error) {
    return serverError(error);
  }
}
