import type { MetadataRoute } from 'next';
import { getActiveExams } from '@/lib/catalog-data';
import { getSiteUrl } from '@/lib/seo';

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
  ];

  const examRoutes: MetadataRoute.Sitemap = exams.map((exam: any) => ({
    url: `${siteUrl}/exam/${exam.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...examRoutes];
}
