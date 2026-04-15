'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type SiteSettings,
} from '@/lib/site-settings-config';

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);
const SiteSettingsUpdateContext = createContext<(settings: SiteSettings) => void>(() => {});

export function SiteSettingsProvider({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
}) {
  const [currentSettings, setCurrentSettings] = useState(settings);

  useEffect(() => {
    setCurrentSettings(normalizeSiteSettings(settings));
  }, [settings]);

  useEffect(() => {
    let active = true;

    async function refreshSettings() {
      try {
        const res = await fetch('/api/site-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data?.success || !data?.data) return;
        setCurrentSettings(normalizeSiteSettings(data.data));
      } catch {
        // Keep the server-provided settings if live refresh fails.
      }
    }

    refreshSettings();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SiteSettingsUpdateContext.Provider value={(next) => setCurrentSettings(normalizeSiteSettings(next))}>
      <SiteSettingsContext.Provider value={currentSettings}>
        {children}
      </SiteSettingsContext.Provider>
    </SiteSettingsUpdateContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function useUpdateSiteSettings() {
  return useContext(SiteSettingsUpdateContext);
}
