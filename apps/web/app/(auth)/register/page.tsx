'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/branding/BrandMark';
import { useSiteSettings } from '@/components/branding/SiteSettingsProvider';

const COPY = {
  en: {
    toggle: 'नेपाली',
    home: 'Home',
    signInLink: 'Sign in',
    create: 'Create your account',
    subtitle: 'Free forever. Start your prep today with',
    google: 'Sign up with Google',
    or: 'or',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    fullNamePlaceholder: 'Ram Bahadur Thapa',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'At least 8 characters',
    passwordShort: 'Password must be at least 8 characters',
    failed: 'Registration failed',
    wrong: 'Something went wrong',
    creating: 'Creating account…',
    createButton: 'Create account',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
  },
  ne: {
    toggle: 'English',
    home: 'होम',
    signInLink: 'लगइन',
    create: 'नयाँ खाता बनाउनुहोस्',
    subtitle: 'निःशुल्क सुरु गर्नुहोस्',
    google: 'Google मार्फत साइन अप गर्नुहोस्',
    or: 'वा',
    fullName: 'पूरा नाम',
    email: 'इमेल',
    password: 'पासवर्ड',
    fullNamePlaceholder: 'राम बहादुर थापा',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'कम्तीमा ८ अक्षर',
    passwordShort: 'पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ',
    failed: 'दर्ता सफल भएन',
    wrong: 'केही समस्या भयो',
    creating: 'खाता बनाउँदै…',
    createButton: 'खाता बनाउनुहोस्',
    hasAccount: 'पहिले नै खाता छ?',
    signIn: 'लगइन',
  },
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const settings = useSiteSettings();
  const t = COPY[language];

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [router, status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { setError(t.passwordShort); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await signIn('credentials', { email: form.email, password: form.password, callbackUrl: '/dashboard' });
      } else {
        setError(data.error ?? t.failed);
        setLoading(false);
      }
    } catch { setError(t.wrong); setLoading(false); }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen px-4">
        <nav className="page-wrap pb-0">
          <div className="card glass px-5 py-3 flex items-center justify-between">
            <BrandMark name={settings.brandName} logoUrl={settings.logoUrl} compact />
            <button type="button" className="btn-secondary py-2" onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}>
              {t.toggle}
            </button>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4">
      <nav className="page-wrap pb-0">
        <div className="card glass px-5 py-3 flex items-center justify-between">
          <BrandMark name={settings.brandName} logoUrl={settings.logoUrl} compact />
          <div className="flex items-center gap-3">
            <button type="button" className="btn-secondary py-2" onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}>
              {t.toggle}
            </button>
            <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">{t.home}</Link>
            <Link href="/login" className="btn-secondary py-2">{t.signInLink}</Link>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center py-8 md:py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <BrandMark name={settings.brandName} logoUrl={settings.logoUrl} />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text)] mt-3">{t.create}</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{t.subtitle} {settings.brandName}.</p>
        </div>
        <div className="card glass p-6 space-y-4">
          <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t.google}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--line)]" />
            <span className="text-xs text-[var(--muted)]">{t.or}</span>
            <div className="flex-1 h-px bg-[var(--line)]" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t.fullName}</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input" placeholder={t.fullNamePlaceholder} />
            </div>
            <div>
              <label className="label">{t.email}</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input" placeholder={t.emailPlaceholder} />
            </div>
            <div>
              <label className="label">{t.password}</label>
              <input type="password" required minLength={8} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input" placeholder={t.passwordPlaceholder} />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? t.creating : t.createButton}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[var(--muted)] mt-4">
          {t.hasAccount}{' '}
          <Link href="/login" className="text-[var(--brand)] hover:opacity-90 font-semibold">{t.signIn}</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
