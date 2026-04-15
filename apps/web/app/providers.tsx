'use client';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SiteSettingsProvider } from '@/components/branding/SiteSettingsProvider';
import type { SiteSettings } from '@/lib/site-settings-config';

export function Providers({
  children,
  siteSettings,
}: {
  children: React.ReactNode;
  siteSettings: SiteSettings;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <SiteSettingsProvider settings={siteSettings}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SiteSettingsProvider>
    </SessionProvider>
  );
}
