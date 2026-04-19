import { cache } from 'react';
import { connectDB } from '@/lib/db';
import { SiteSetting } from '@psc/shared/models';
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_LOGO_URL,
  type SiteSettings,
  normalizeLogoUrl,
  normalizeSiteSettings,
} from '@/lib/site-settings-config';

function getStoredLogoUrl(value: unknown) {
  const normalized = normalizeLogoUrl(value);
  if (normalized.startsWith('data:image/') || normalized.startsWith('/api/site-logo')) {
    return DEFAULT_LOGO_URL;
  }
  return normalized;
}

function mapSettings(record: any): SiteSettings {
  if (!record) return DEFAULT_SITE_SETTINGS;
  const legacyDataLogo = typeof record.logo_url === 'string' && record.logo_url.startsWith('data:image/');
  const uploadedDataLogo =
    typeof record.logo_data_url === 'string' && record.logo_data_url.startsWith('data:image/');
  const hasUploadedLogo = uploadedDataLogo || legacyDataLogo;
  const updatedAt =
    record.updated_at instanceof Date
      ? record.updated_at.getTime()
      : record.updated_at
        ? new Date(record.updated_at).getTime()
        : Date.now();

  return normalizeSiteSettings({
    brandName: record.brand_name,
    tagline: record.tagline,
    logoUrl: hasUploadedLogo ? `/api/site-logo?v=${updatedAt}` : getStoredLogoUrl(record.logo_url),
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
  const existing: any = await SiteSetting.findOne({ key: 'site' }).lean();
  const rawLogoUrl = typeof input.logoUrl === 'string' ? input.logoUrl.trim() : '';
  const existingLogoDataUrl =
    existing?.logo_data_url ||
    (typeof existing?.logo_url === 'string' && existing.logo_url.startsWith('data:image/')
      ? existing.logo_url
      : '');

  let nextLogoUrl = normalized.logoUrl;
  let nextLogoDataUrl = '';

  if (rawLogoUrl.startsWith('data:image/')) {
    nextLogoUrl = getStoredLogoUrl(existing?.logo_url);
    nextLogoDataUrl = rawLogoUrl;
  } else if (rawLogoUrl.startsWith('/api/site-logo')) {
    nextLogoUrl = getStoredLogoUrl(existing?.logo_url);
    nextLogoDataUrl = existingLogoDataUrl;
  } else {
    nextLogoUrl = getStoredLogoUrl(rawLogoUrl);
    nextLogoDataUrl = '';
  }

  const updated = await SiteSetting.findOneAndUpdate(
    { key: 'site' },
    {
      $set: {
        brand_name: normalized.brandName,
        tagline: normalized.tagline,
        logo_url: nextLogoUrl,
        logo_data_url: nextLogoDataUrl,
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
