import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Subject, Exam } from '@psc/shared/models';
import { ok, created, err, unauthorized, forbidden, notFound, serverError } from '@/lib/apiResponse';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const exam_id = searchParams.get('exam_id');
    const exam_slug = searchParams.get('exam_slug');

    let resolvedExamId = exam_id;

    if (!resolvedExamId && exam_slug) {
      await connectDB();
      const exam = await Exam.findOne({ slug: exam_slug }).select('_id').lean() as any;
      if (!exam) return err('Exam not found', 404);
      resolvedExamId = exam._id.toString();
    }

    if (!resolvedExamId) return err('exam_id or exam_slug is required');

    const cached = await cacheGet(CacheKeys.subjects(resolvedExamId));
    if (cached) return ok(cached);

    await connectDB();
    const subjects = await Subject.find({ exam_id: resolvedExamId, is_active: true })
      .select('name slug weightage_percent question_count description')
      .lean();

    await cacheSet(CacheKeys.subjects(resolvedExamId), subjects, 300);
    return ok(subjects);
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
    const subject = await Subject.create(body);
    return created(subject);
  } catch (e) {
    return serverError(e);
  }
}

// Named export for PUT (update subject) — admin only
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();
    await connectDB();
    const body = await req.json();
    const { _id, ...update } = body;
    const subject = await Subject.findByIdAndUpdate(_id, update, { new: true, runValidators: true });
    if (!subject) return notFound('Subject');
    return ok(subject);
  } catch (e) {
    return serverError(e);
  }
}
