import { connectDB } from '@/lib/db';
import { SiteSetting } from '@psc/shared/models';
import { DEFAULT_LOGO_URL } from '@/lib/site-settings-config';

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const [, contentType, base64] = match;
  return {
    contentType,
    buffer: Buffer.from(base64, 'base64'),
  };
}

export async function GET(req: Request) {
  await connectDB();
  const record: any = await SiteSetting.findOne({ key: 'site' }).select('logo_data_url logo_url').lean();
  const rawLogoDataUrl =
    record?.logo_data_url ||
    (typeof record?.logo_url === 'string' && record.logo_url.startsWith('data:image/')
      ? record.logo_url
      : '');

  if (rawLogoDataUrl) {
    const decoded = decodeDataUrl(rawLogoDataUrl);
    if (decoded) {
      return new Response(decoded.buffer, {
        headers: {
          'Content-Type': decoded.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  const fallback = record?.logo_url || DEFAULT_LOGO_URL;
  return Response.redirect(new URL(fallback, req.url), 307);
}
