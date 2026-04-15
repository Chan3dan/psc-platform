import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Subject, MockTest } from '@psc/shared/models';
import { ok, notFound, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { cacheGet, cacheSet, cacheDel, CacheKeys } from '@/lib/redis';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const cached = await cacheGet(CacheKeys.exam(params.slug));
    if (cached) return ok(cached);

    await connectDB();
    const exam = await Exam.findOne({ slug: params.slug, is_active: true }).lean();
    if (!exam) return notFound('Exam');

    const [subjects, mockTests] = await Promise.all([
      Subject.find({ exam_id: (exam as any)._id, is_active: true })
        .select('name slug weightage_percent question_count description')
        .lean(),
      MockTest.find({ exam_id: (exam as any)._id, is_active: true })
        .select('title slug duration_minutes total_questions total_marks attempt_count')
        .lean(),
    ]);

    const data = { ...exam, subjects, mock_tests: mockTests };
    await cacheSet(CacheKeys.exam(params.slug), data, 300);
    return ok(data);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    await connectDB();
    const body = await req.json();
    const exam = await Exam.findOneAndUpdate(
      { slug: params.slug },
      body,
      { new: true, runValidators: true }
    );
    if (!exam) return notFound('Exam');
    await cacheDel(CacheKeys.exam(params.slug));
    return ok(exam);
  } catch (e) {
    return serverError(e);
  }
}
