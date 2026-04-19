'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/branding/BrandMark';
import { useUpdateSiteSettings } from '@/components/branding/SiteSettingsProvider';
import {
  DEFAULT_SITE_SETTINGS,
  getAdminBrandName,
  type SiteSettings,
} from '@/lib/site-settings-config';

export function SiteSettingsForm({ initialSettings }: { initialSettings: SiteSettings }) {
  const [form, setForm] = useState(initialSettings);
  const [logoInput, setLogoInput] = useState(
    initialSettings.logoUrl.startsWith('/api/site-logo') ? '' : initialSettings.logoUrl
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const updateSiteSettings = useUpdateSiteSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(initialSettings);
    setLogoInput(initialSettings.logoUrl.startsWith('/api/site-logo') ? '' : initialSettings.logoUrl);
  }, [initialSettings]);

  function updateField<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateLogoValue(value: string) {
    setLogoInput(value);
    updateField('logoUrl', value as SiteSettings['logoUrl']);
  }

  async function parseApiResponse(res: Response) {
    const raw = await res.text();
    if (!raw.trim()) {
      throw new Error(`Settings save returned an empty response (${res.status}).`);
    }

    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(raw.slice(0, 180) || 'Settings save returned an invalid response.');
    }
  }

  async function compressLogo(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Could not read that logo file.'));
      };
      reader.onerror = () => reject(new Error('Could not read that logo file.'));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load that logo image.'));
      img.src = dataUrl;
    });

    const maxDimension = 512;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not prepare that logo image.');
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = mimeType === 'image/jpeg' ? 0.86 : undefined;
    const compressed = canvas.toDataURL(mimeType, quality);

    if (compressed.length > 900_000) {
      throw new Error('Logo is still too large after compression. Please use a smaller image.');
    }

    return compressed;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await parseApiResponse(res);
      if (!data.success) {
        throw new Error(data.error ?? 'Failed to save settings');
      }

      startTransition(() => {
        setForm(data.data);
        setLogoInput(data.data.logoUrl.startsWith('/api/site-logo') ? '' : data.data.logoUrl);
        updateSiteSettings(data.data);
        setMessage('Site settings saved. Branding updates are live across the app.');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(DEFAULT_SITE_SETTINGS);
    setLogoInput(DEFAULT_SITE_SETTINGS.logoUrl);
    setMessage('');
    setError('');
  }

  function handleLogoUpload(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file for the logo.');
      return;
    }
    if (file.size > 4_000_000) {
      setError('Logo file is too large. Please use an image under 4 MB.');
      return;
    }

    setError('');
    setMessage('Preparing logo for upload...');

    compressLogo(file)
      .then((result) => {
        updateField('logoUrl', result as SiteSettings['logoUrl']);
        setLogoInput('');
        setMessage('Logo loaded into settings. Save settings to publish the uploaded image.');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not prepare that logo file.');
        setMessage('');
      });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <form onSubmit={handleSubmit} className="card p-5 md:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text)]">Brand Settings</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Update the live brand name, logo, and homepage copy from one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Brand name</label>
            <input
              className="input"
              value={form.brandName}
              onChange={(e) => updateField('brandName', e.target.value)}
              placeholder="Niyukta"
            />
          </div>
          <div>
            <label className="label">Live badge</label>
            <input
              className="input"
              value={form.liveLabel}
              onChange={(e) => updateField('liveLabel', e.target.value)}
              placeholder="Live"
            />
          </div>
        </div>

        <div>
          <label className="label">Logo source</label>
          <input
            className="input"
            value={logoInput}
            onChange={(e) => updateLogoValue(e.target.value)}
            placeholder="/brand/niyukta-logo.jpeg"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload logo
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => updateLogoValue(DEFAULT_SITE_SETTINGS.logoUrl)}
            >
              Use default logo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            Paste a public path like `/brand/niyukta-logo.jpeg`, or upload a small logo image directly.
          </p>
          {form.logoUrl.startsWith('/api/site-logo') ? (
            <p className="text-xs text-emerald-600 mt-1">
              Uploaded logo is active right now.
            </p>
          ) : null}
        </div>

        <div>
          <label className="label">Tagline</label>
          <input
            className="input"
            value={form.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder="Prepare Smart. Get Niyukta."
          />
        </div>

        <div>
          <label className="label">Hero badge</label>
          <input
            className="input"
            value={form.heroBadge}
            onChange={(e) => updateField('heroBadge', e.target.value)}
            placeholder="Built for Loksewa Aspirants"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Hero title prefix</label>
            <input
              className="input"
              value={form.heroTitlePrefix}
              onChange={(e) => updateField('heroTitlePrefix', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Hero title highlight</label>
            <input
              className="input"
              value={form.heroTitleHighlight}
              onChange={(e) => updateField('heroTitleHighlight', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Hero description</label>
          <textarea
            className="input min-h-[120px]"
            value={form.heroDescription}
            onChange={(e) => updateField('heroDescription', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Footer text</label>
          <input
            className="input"
            value={form.footerText}
            onChange={(e) => updateField('footerText', e.target.value)}
          />
        </div>

        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset} disabled={saving}>
            Reset defaults
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="card p-5 md:p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text)]">Live Preview</h2>
          <BrandMark name={form.brandName} logoUrl={form.logoUrl} subtitle={form.tagline} />
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/35 p-4 space-y-2">
            <span className="badge-blue">{form.liveLabel}</span>
            <p className="text-sm font-semibold text-[var(--brand)]">{form.heroBadge}</p>
            <h3 className="text-2xl font-bold text-[var(--text)]">
              {form.heroTitlePrefix}
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                {form.heroTitleHighlight}
              </span>
            </h3>
            <p className="text-sm text-[var(--muted)]">{form.heroDescription}</p>
          </div>
        </div>

        <div className="card p-5 md:p-6 space-y-2">
          <h2 className="text-base font-semibold text-[var(--text)]">Admin Label</h2>
          <p className="text-sm text-[var(--muted)]">
            Admin navigation will automatically use <span className="font-semibold text-[var(--text)]">{getAdminBrandName(form)}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
