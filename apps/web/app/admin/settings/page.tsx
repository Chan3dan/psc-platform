import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';
import { getSiteSettings } from '@/lib/site-settings';

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Site Settings</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage the live brand name, logo, and homepage copy for the whole platform.
        </p>
      </div>

      <SiteSettingsForm initialSettings={settings} />
    </div>
  );
}
