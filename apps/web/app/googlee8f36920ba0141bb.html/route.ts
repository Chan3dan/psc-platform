export const dynamic = 'force-static';

export async function GET() {
  return new Response('google-site-verification: googlee8f36920ba0141bb.html', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
