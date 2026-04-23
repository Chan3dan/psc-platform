import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';
import { ok, created, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/redis';
import { uploadPDF } from '@/lib/cloudinary';

function normalizeExamPayload(body: Record<string, any>) {
  if (typeof body.pattern_config === 'string' && body.pattern_config.trim()) {
    try {
      body.pattern_config = JSON.parse(body.pattern_config);
    } catch {
      throw new Error('Invalid pattern_config JSON');
    }
  }

  for (const key of ['duration_minutes', 'total_questions', 'total_marks', 'passing_marks', 'negative_marking']) {
    if (body[key] !== undefined && body[key] !== '') body[key] = Number(body[key]);
  }
  if (body.is_active !== undefined) body.is_active = body.is_active === true || body.is_active === 'true';
  return body;
}

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
    const contentType = req.headers.get('content-type') ?? '';
    let body: Record<string, any>;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {};
      for (const [key, value] of formData.entries()) {
        if (key === 'syllabus_pdf') continue;
        body[key] = typeof value === 'string' ? value : '';
      }

      const file = formData.get('syllabus_pdf') as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadPDF(buffer, 'psc-syllabus');
        body.syllabus_pdf_url = result.url;
      }
    } else {
      body = await req.json();
    }

    body = normalizeExamPayload(body);

    const exam = await Exam.create(body);
    await cacheSet(CacheKeys.exams(), null, 0); // invalidate cache
    return created(exam);
  } catch (e) {
    return serverError(e);
  }
}
