import { getActiveExams } from '@/lib/catalog-data';
import { getSiteUrl } from '@/lib/seo';
import { PUBLIC_TOPIC_ROUTES } from '@/lib/seo-landing-pages';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

type SitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
};

export async function GET() {
  const siteUrl = getSiteUrl().replace(/\/+$/, '');
  const now = new Date().toISOString();
  const exams = (await getActiveExams()) as any[];

  const staticRoutes: SitemapEntry[] = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...PUBLIC_TOPIC_ROUTES.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ];

  const examRoutes: SitemapEntry[] = exams.map((exam: any) => ({
    url: `${siteUrl}/exam/${exam.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const entries = [...staticRoutes, ...examRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
