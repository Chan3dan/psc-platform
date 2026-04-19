import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { getSiteSettings, saveSiteSettings } from '@/lib/site-settings';
import { forbidden, ok, serverError, unauthorized } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return ok(settings);
  } catch (error) {
    return serverError(error);
  }
}

async function handleSave(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const body = await req.json();
    const settings = await saveSiteSettings(body);

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/login');
    revalidatePath('/register');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/admin', 'layout');

    return ok(settings);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(req: Request) {
  return handleSave(req);
}

export async function POST(req: Request) {
  return handleSave(req);
}
