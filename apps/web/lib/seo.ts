import type { Metadata } from 'next';
import type { SiteSettings } from '@/lib/site-settings-config';

const FALLBACK_SITE_URL = 'https://web-six-blond-80.vercel.app';

export const SEO_KEYWORDS = [
  'Niyukta',
  'Loksewa preparation',
  'Loksewa exam prep Nepal',
  'Computer Operator preparation Nepal',
  'PSC Nepal MCQ practice',
  'Loksewa mock test',
  'Nepal civil service exam preparation',
  'Computer Operator mock test',
  'Loksewa notes',
  'Nepal government job exam preparation',
] as const;

function normalizeUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }
  return null;
}

export function getSiteUrl() {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(process.env.NEXTAUTH_URL) ??
    FALLBACK_SITE_URL
  );
}

export function getMetadataBase() {
  return new URL(getSiteUrl());
}

export function joinSiteUrl(path = '/') {
  return new URL(path, getMetadataBase()).toString();
}

export function buildDefaultMetadata(settings: SiteSettings): Metadata {
  const brandName = settings.brandName;
  const title = `${brandName} — ${settings.tagline}`;
  const description = `${settings.heroDescription} Prepare for Loksewa, Computer Operator, and Nepal civil service exams with ${brandName}.`;
  const iconUrl = settings.logoUrl.startsWith('data:image/') ? '/brand/niyukta-logo.jpeg' : settings.logoUrl;

  return {
    metadataBase: getMetadataBase(),
    applicationName: brandName,
    title: {
      template: `%s | ${brandName}`,
      default: title,
    },
    description,
    keywords: [...SEO_KEYWORDS],
    alternates: {
      canonical: '/',
    },
    category: 'education',
    openGraph: {
      type: 'website',
      locale: 'en_NP',
      url: '/',
      title,
      description,
      siteName: brandName,
      images: [
        {
          url: iconUrl,
          width: 512,
          height: 512,
          alt: `${brandName} logo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [iconUrl],
    },
    icons: {
      icon: [{ url: iconUrl }, { url: '/brand/niyukta-logo.jpeg' }],
      shortcut: iconUrl,
      apple: iconUrl,
    },
    manifest: '/manifest.webmanifest',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

export function buildNoIndexMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}
