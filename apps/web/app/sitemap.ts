import type { MetadataRoute } from 'next';
import { getActiveExams } from '@/lib/catalog-data';
import { getSiteUrl } from '@/lib/seo';
import { PUBLIC_TOPIC_ROUTES } from '@/lib/seo-landing-pages';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const exams = (await getActiveExams()) as any[];

  const staticRoutes: MetadataRoute.Sitemap = [
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

  const examRoutes: MetadataRoute.Sitemap = exams.map((exam: any) => ({
    url: `${siteUrl}/exam/${exam.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...examRoutes];
}
