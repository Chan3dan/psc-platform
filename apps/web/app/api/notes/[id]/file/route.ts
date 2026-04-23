import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Note } from '@psc/shared/models';
import { err, notFound, serverError, unauthorized } from '@/lib/apiResponse';
import { extractRawPublicIdFromUrl, getSignedPdfUrlCandidates } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

function htmlError(message: string, status = 502) {
  return new NextResponse(
    `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b1220; color: #e5edff; font-family: system-ui, sans-serif; }
            main { max-width: 520px; padding: 24px; text-align: center; }
            h1 { font-size: 22px; margin: 0 0 10px; }
            p { color: #aebad1; line-height: 1.5; }
          </style>
        </head>
        <body>
          <main>
            <h1>PDF could not be opened</h1>
            <p>${message}</p>
            <p>Please close this viewer and try again, or ask the admin to re-upload this PDF.</p>
          </main>
        </body>
      </html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );
}

async function fetchFirstPdf(urls: string[]) {
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/pdf,*/*;q=0.8' },
      });
      const contentType = response.headers.get('content-type') ?? '';
      if (
        response.ok &&
        response.body &&
        !contentType.includes('application/json') &&
        !contentType.includes('text/html')
      ) {
        return response;
      }
    } catch {
      // Try the next candidate URL.
    }
  }
  return null;
}

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

    const candidateUrls = getSignedPdfUrlCandidates(publicId);
    if (note.content_url) candidateUrls.push(note.content_url);
    const upstream = await fetchFirstPdf(candidateUrls);
    if (!upstream?.body) {
      return htmlError('The stored PDF file could not be reached from the file provider.', 502);
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
