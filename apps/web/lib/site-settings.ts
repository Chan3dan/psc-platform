import { cache } from 'react';
import { connectDB } from '@/lib/db';
import { SiteSetting } from '@psc/shared/models';
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
  normalizeSiteSettings,
} from '@/lib/site-settings-config';

function mapSettings(record: any): SiteSettings {
  if (!record) return DEFAULT_SITE_SETTINGS;

  return normalizeSiteSettings({
    brandName: record.brand_name,
    tagline: record.tagline,
    logoUrl: record.logo_url,
    liveLabel: record.live_label,
    heroBadge: record.hero_badge,
    heroTitlePrefix: record.hero_title_prefix,
    heroTitleHighlight: record.hero_title_highlight,
    heroDescription: record.hero_description,
    footerText: record.footer_text,
  });
}

export const getSiteSettings = cache(async () => {
  await connectDB();
  const record = await SiteSetting.findOne({ key: 'site' }).lean();
  return mapSettings(record);
});

export async function saveSiteSettings(input: Record<string, unknown>) {
  await connectDB();
  const normalized = normalizeSiteSettings(input);

  const updated = await SiteSetting.findOneAndUpdate(
    { key: 'site' },
    {
      $set: {
        brand_name: normalized.brandName,
        tagline: normalized.tagline,
        logo_url: normalized.logoUrl,
        live_label: normalized.liveLabel,
        hero_badge: normalized.heroBadge,
        hero_title_prefix: normalized.heroTitlePrefix,
        hero_title_highlight: normalized.heroTitleHighlight,
        hero_description: normalized.heroDescription,
        footer_text: normalized.footerText,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return mapSettings(updated);
}
