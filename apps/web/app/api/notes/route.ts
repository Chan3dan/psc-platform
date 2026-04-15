import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Note } from '@psc/shared/models';
import { ok, created, err, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { uploadPDF } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const exam_id = searchParams.get('exam_id');
    const subject_id = searchParams.get('subject_id');
    if (!exam_id) return err('exam_id is required');

    await connectDB();
    const filter: Record<string, unknown> = { exam_id, is_active: true };
    if (subject_id) filter.subject_id = subject_id;

    const notes = await Note.find(filter)
      .select('title content_type content_url content_html subject_id created_at')
      .populate('subject_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    return ok(notes);
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
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const exam_id = formData.get('exam_id') as string;
    const subject_id = formData.get('subject_id') as string | null;
    const title = formData.get('title') as string;
    const content_html = formData.get('content_html') as string | null;

    if (!exam_id || !title) return err('exam_id and title are required');

    let content_url = '';
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadPDF(buffer, 'psc-notes');
      content_url = result.url;
    }

    const note = await Note.create({
      exam_id,
      subject_id: subject_id || undefined,
      title: title.trim(),
      content_type: file ? 'pdf' : 'richtext',
      content_url,
      content_html: content_html || '',
      uploaded_by: session.user.id,
      is_active: true,
    });

    return created(note);
  } catch (e) {
    return serverError(e);
  }
}
