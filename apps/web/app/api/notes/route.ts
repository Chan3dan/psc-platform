import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Note } from '@psc/shared/models';
import { ok, created, err, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { uploadPDF } from '@/lib/cloudinary';
import { Types } from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const exam_id = searchParams.get('exam_id');
    const subject_id = searchParams.get('subject_id');
    const admin = searchParams.get('admin') === '1';

    let isAdmin = false;
    if (admin) {
      const session = await getServerSession(authOptions);
      if (!session) return unauthorized();
      if (session.user.role !== 'admin') return forbidden();
      isAdmin = true;
    }

    if (!exam_id && !isAdmin) return err('exam_id is required');

    await connectDB();
    const filter: Record<string, unknown> = isAdmin ? {} : { is_active: true };
    if (exam_id) filter.exam_id = exam_id;
    if (subject_id) filter.subject_id = subject_id;

    const notes = await Note.find(filter)
      .select('title content_type content_url content_html subject_id exam_id is_active created_at updatedAt')
      .populate('exam_id', 'name slug')
      .populate('subject_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    const normalized = (notes as any[]).map((note) => ({
      ...note,
      content_url:
        note.content_type === 'pdf' && Types.ObjectId.isValid(String(note._id))
          ? `/api/notes/${note._id}/file`
          : note.content_url,
    }));

    return ok(normalized);
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
    const content_type = (formData.get('content_type') as string | null) ?? (file ? 'pdf' : 'richtext');

    if (!exam_id || !title) return err('exam_id and title are required');
    if (content_type === 'pdf' && !file) return err('PDF file is required for PDF notes');
    if (content_type === 'richtext' && !content_html?.trim()) return err('Rich text content is required');

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
      content_type: content_type === 'pdf' ? 'pdf' : 'richtext',
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
