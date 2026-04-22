import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, err, unauthorized, notFound, serverError } from '@/lib/apiResponse';
import { buildTestSession } from '@/lib/test-session';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const body = await req.json();
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
