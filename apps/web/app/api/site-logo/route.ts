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

function isLikelyImagePayload(contentType: string, buffer: Buffer) {
  if (!buffer.length || buffer.length < 64) return false;

  if (contentType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }

  if (contentType === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (contentType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  if (contentType === 'image/gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }

  if (contentType === 'image/svg+xml') {
    return buffer.toString('utf8', 0, Math.min(buffer.length, 256)).includes('<svg');
  }

  return true;
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
    if (decoded && isLikelyImagePayload(decoded.contentType, decoded.buffer)) {
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
