export interface SiteSettings {
  brandName: string;
  tagline: string;
  logoUrl: string;
  liveLabel: string;
  heroBadge: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroDescription: string;
  footerText: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'Niyukta',
  tagline: 'Prepare Smart. Get Niyukta.',
  logoUrl: '/brand/niyukta-logo.jpeg',
  liveLabel: 'Live',
  heroBadge: 'Built for Loksewa Aspirants',
  heroTitlePrefix: 'Modern exam prep that turns',
  heroTitleHighlight: 'study time into rank gain',
  heroDescription:
    'Practice smarter with adaptive MCQs, full mock tests, and advanced analytics designed for Nepal civil service exam success.',
  footerText: 'Prepare Smart. Get Niyukta.',
};

function cleanText(value: unknown, fallback: string) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

export function normalizeSiteSettings(
  input: Partial<SiteSettings> | Record<string, unknown> = {}
): SiteSettings {
  return {
    brandName: cleanText(input.brandName, DEFAULT_SITE_SETTINGS.brandName),
    tagline: cleanText(input.tagline, DEFAULT_SITE_SETTINGS.tagline),
    logoUrl: cleanText(input.logoUrl, DEFAULT_SITE_SETTINGS.logoUrl),
    liveLabel: cleanText(input.liveLabel, DEFAULT_SITE_SETTINGS.liveLabel),
    heroBadge: cleanText(input.heroBadge, DEFAULT_SITE_SETTINGS.heroBadge),
    heroTitlePrefix: cleanText(input.heroTitlePrefix, DEFAULT_SITE_SETTINGS.heroTitlePrefix),
    heroTitleHighlight: cleanText(input.heroTitleHighlight, DEFAULT_SITE_SETTINGS.heroTitleHighlight),
    heroDescription: cleanText(input.heroDescription, DEFAULT_SITE_SETTINGS.heroDescription),
    footerText: cleanText(input.footerText, DEFAULT_SITE_SETTINGS.footerText),
  };
}

export function getAdminBrandName(settings: SiteSettings) {
  return `${settings.brandName} Admin`;
}
