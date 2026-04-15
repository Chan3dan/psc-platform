'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
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
        setError(data.error ?? 'Registration failed');
        setLoading(false);
      }
    } catch { setError('Something went wrong'); setLoading(false); }
  }

  return (
    <div className="min-h-screen px-4">
      <nav className="page-wrap pb-0">
        <div className="card glass px-5 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[var(--text)]">PSC Prep</Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Home</Link>
            <Link href="/login" className="btn-secondary py-2">Sign in</Link>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center py-8 md:py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-[var(--text)]">PSC Prep</Link>
          <h1 className="text-2xl font-semibold text-[var(--text)] mt-3">Create your account</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Free forever. Start your prep today.</p>
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
            Sign up with Google
          </button>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--line)]" />
            <span className="text-xs text-[var(--muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--line)]" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input" placeholder="Ram Bahadur Thapa" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required minLength={8} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input" placeholder="At least 8 characters" />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[var(--muted)] mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--brand)] hover:opacity-90 font-semibold">Sign in</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
