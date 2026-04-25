// ============================================================
// FILE: apps/web/app/layout.tsx — Root layout
// ============================================================
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
import './globals.css';
import { getSiteSettings } from '@/lib/site-settings';
import { buildDefaultMetadata } from '@/lib/seo';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildDefaultMetadata(settings);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${mono.variable} font-sans antialiased`}>
        <Script id="niyukta-theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var stored = localStorage.getItem('niyukta-theme');
                var theme = stored === 'light' || stored === 'dark'
                  ? stored
                  : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', theme);
              } catch (error) {}
            })();
          `}
        </Script>
        <Providers siteSettings={settings}>{children}</Providers>
      </body>
    </html>
  );
}
