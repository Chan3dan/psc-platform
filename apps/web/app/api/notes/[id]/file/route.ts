import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Note } from '@psc/shared/models';
import { err, notFound, serverError, unauthorized } from '@/lib/apiResponse';
import { extractRawPublicIdFromUrl, getSignedPdfDownloadUrl } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const note = (await Note.findById(params.id)
      .select('content_type content_url is_active')
      .lean()) as any;

    if (!note || !note.is_active) return notFound('Note');
    if (note.content_type !== 'pdf' || !note.content_url) {
      return err('This note does not have a PDF file.', 400);
    }

    const publicId = extractRawPublicIdFromUrl(note.content_url);
    if (!publicId) {
      return err('Could not resolve the PDF asset path.', 400);
    }

    const signedUrl = getSignedPdfDownloadUrl(publicId);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return serverError(error);
  }
}
