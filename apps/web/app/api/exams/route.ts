import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/redis';

export async function GET() {
  try {
    const cached = await cacheGet(CacheKeys.exams());
    if (cached) return ok(cached);

    await connectDB();
    const exams = await Exam.find({ is_active: true })
      .select('name slug description duration_minutes total_marks total_questions negative_marking thumbnail_url')
      .lean();

    await cacheSet(CacheKeys.exams(), exams, 600); // cache 10min
    return ok(exams);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    await connectDB();
    const body = await req.json();
    const exam = await Exam.create(body);
    await cacheSet(CacheKeys.exams(), null, 0); // invalidate cache
    return created(exam);
  } catch (e) {
    return serverError(e);
  }
}
