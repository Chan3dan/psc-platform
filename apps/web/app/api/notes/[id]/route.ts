import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Note } from '@psc/shared/models';
import { err, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { deleteFile, extractRawPublicIdFromUrl, uploadPDF } from '@/lib/cloudinary';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { response: unauthorized() };
  if (session.user.role !== 'admin') return { response: forbidden() };
  return { session };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;
    if (!Types.ObjectId.isValid(params.id)) return err('Invalid note id');

    await connectDB();
    const existing = await Note.findById(params.id).select('content_url').lean() as any;
    if (!existing) return notFound('Note');

    const formData = await req.formData();
    const title = formData.get('title') as string | null;
    const exam_id = formData.get('exam_id') as string | null;
    const subject_id = formData.get('subject_id') as string | null;
    const content_type = formData.get('content_type') as string | null;
    const content_html = formData.get('content_html') as string | null;
    const is_active = formData.get('is_active') as string | null;
    const file = formData.get('file') as File | null;

    const set: Record<string, unknown> = {};
    const unset: Record<string, ''> = {};

    if (title !== null) {
      if (!title.trim()) return err('Title is required');
      set.title = title.trim();
    }
    if (exam_id !== null) {
      if (!Types.ObjectId.isValid(exam_id)) return err('Invalid exam_id');
      set.exam_id = exam_id;
    }
    if (subject_id !== null) {
      if (subject_id && !Types.ObjectId.isValid(subject_id)) return err('Invalid subject_id');
      if (subject_id) set.subject_id = subject_id;
      else unset.subject_id = '';
    }
    if (typeof is_active === 'string') set.is_active = is_active === 'true';

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadPDF(buffer, 'psc-notes');
      set.content_type = 'pdf';
      set.content_url = result.url;
      set.content_html = '';

      const oldPublicId = existing.content_url ? extractRawPublicIdFromUrl(existing.content_url) : null;
      if (oldPublicId) deleteFile(oldPublicId, 'raw').catch(() => undefined);
    } else if (content_type === 'richtext') {
      if (!content_html?.trim()) return err('Rich text content is required');
      set.content_type = 'richtext';
      set.content_html = content_html;
      set.content_url = '';
    } else if (content_type === 'pdf') {
      set.content_type = 'pdf';
      set.content_html = '';
    } else if (content_html !== null) {
      set.content_html = content_html;
    }

    const updated = await Note.findByIdAndUpdate(
      params.id,
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { new: true, runValidators: true }
    )
      .populate('exam_id', 'name slug')
      .populate('subject_id', 'name')
      .lean();

    if (!updated) return notFound('Note');
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;
    if (!Types.ObjectId.isValid(params.id)) return err('Invalid note id');

    await connectDB();
    const deleted = await Note.findByIdAndDelete(params.id).lean() as any;
    if (!deleted) return notFound('Note');

    const publicId = deleted.content_url ? extractRawPublicIdFromUrl(deleted.content_url) : null;
    if (publicId) deleteFile(publicId, 'raw').catch(() => undefined);

    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
