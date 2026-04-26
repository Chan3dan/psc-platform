import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/exam/', '/computer-operator', '/loksewa', '/na-su', '/kharidar', '/gk', '/ict', '/brand/'],
        disallow: ['/admin/', '/dashboard', '/results', '/planner', '/mock', '/practice', '/bookmarks', '/api/', '/login', '/register', '/settings'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
