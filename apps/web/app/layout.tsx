// ============================================================
// FILE: apps/web/app/layout.tsx — Root layout
// ============================================================
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import { getSiteSettings } from '@/lib/site-settings';
import { getMetadataIconUrl } from '@/lib/site-settings-config';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const iconUrl = getMetadataIconUrl(settings.logoUrl);
  return {
    title: { template: `%s | ${settings.brandName}`, default: `${settings.brandName} — ${settings.tagline}` },
    description: settings.heroDescription,
    icons: {
      icon: [{ url: iconUrl }, { url: '/brand/niyukta-logo.jpeg' }],
      shortcut: iconUrl,
      apple: iconUrl,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${mono.variable} font-sans antialiased`}>
        <Providers siteSettings={settings}>{children}</Providers>
      </body>
    </html>
  );
}
