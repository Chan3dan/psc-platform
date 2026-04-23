import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';
import { err, notFound, serverError } from '@/lib/apiResponse';
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
            <h1>Syllabus PDF could not be opened</h1>
            <p>${message}</p>
            <p>Please close this viewer and ask the admin to re-upload the syllabus PDF from the exam settings.</p>
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
      // Try next candidate.
    }
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const exam = (await Exam.findOne({ slug: params.slug })
      .select('syllabus_pdf_url is_active')
      .lean()) as any;

    if (!exam || !exam.is_active) return notFound('Exam');
    if (!exam.syllabus_pdf_url) return err('This exam does not have a syllabus PDF.', 400);

    const publicId = extractRawPublicIdFromUrl(exam.syllabus_pdf_url);
    if (!publicId) {
      return err('Could not resolve the syllabus PDF asset path.', 400);
    }

    const candidateUrls = getSignedPdfUrlCandidates(publicId);
    if (exam.syllabus_pdf_url) candidateUrls.push(exam.syllabus_pdf_url);
    const upstream = await fetchFirstPdf(candidateUrls);
    if (!upstream?.body) {
      return htmlError('The stored syllabus PDF could not be reached from the file provider.', 502);
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
