import type { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import { getSiteUrl } from '@/lib/seo';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();
  const iconUrl = settings.logoUrl.startsWith('data:image/') ? '/brand/niyukta-logo.jpeg' : settings.logoUrl;

  return {
    name: settings.brandName,
    short_name: settings.brandName,
    description: `${settings.heroDescription} Practice Loksewa and Computer Operator exams with ${settings.brandName}.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#f6fbff',
    theme_color: '#0b5fff',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
    scope: siteUrl,
  };
}
