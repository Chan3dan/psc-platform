'use client';

import { useState } from 'react';
import { AppIcon } from '@/components/icons/AppIcon';
import { ExamPreferenceSelector } from '@/components/preferences/ExamPreferenceSelector';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';

interface PreferencePayload {
  language: 'en' | 'ne';
  targetExam: {
    _id: string;
    name: string;
    slug: string;
    description: string;
  } | null;
}

export function UserSettingsClient({
  name,
  email,
  preferences,
  activeExams,
  examTracks,
}: {
  name: string;
  email: string;
  preferences: PreferencePayload;
  activeExams: Array<{ _id: string; name: string; slug: string; description: string }>;
  examTracks: Array<{ slug: string; name: string; shortName: string; status: 'live' | 'coming_soon'; description: string }>;
}) {
  const [language, setLanguage] = useState<'en' | 'ne'>(preferences.language);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function saveLanguage(nextLanguage: 'en' | 'ne') {
    setLanguage(nextLanguage);
    setSavingLanguage(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: nextLanguage }),
      });
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error ?? 'Could not update language');
      }
      setNotice(nextLanguage === 'ne' ? 'भाषा प्राथमिकता अपडेट भयो।' : 'Language preference updated.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not update language');
    } finally {
      setSavingLanguage(false);
    }
  }

  return (
    <div className="page-wrap space-y-6">
      <section className="card glass p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
              <AppIcon name="settings" className="h-3.5 w-3.5" />
              Personal Settings
            </div>
            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--text)]">Control your study experience</h1>
            <p className="mt-2 text-sm text-[var(--muted)] max-w-2xl">
              Change your target exam, choose your preferred language, and send feedback or upcoming exam requests from one place.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] px-4 py-3 text-sm">
            <p className="font-semibold text-[var(--text)]">{name}</p>
            <p className="text-[var(--muted)]">{email}</p>
          </div>
        </div>
      </section>

      <section className="card p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Language</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Set the dashboard language you want to see after login.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void saveLanguage('en')}
            disabled={savingLanguage}
            className={language === 'en' ? 'btn-primary' : 'btn-secondary'}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => void saveLanguage('ne')}
            disabled={savingLanguage}
            className={language === 'ne' ? 'btn-primary' : 'btn-secondary'}
          >
            नेपाली
          </button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
      </section>

      <ExamPreferenceSelector
        activeExams={activeExams}
        tracks={examTracks}
        currentExamId={preferences.targetExam?._id ?? null}
        userName={name}
        userEmail={email}
        title="Target exam"
        description="Your target exam becomes the default context for dashboard, practice, mocks, notes, planner, and leaderboard."
      />

      <FeedbackForm
        title="Feedback and requests"
        description="Need a smoother workflow, found a bug, or want an exam like NaSu or Kharidar next? Send it here."
        initialName={name}
        initialEmail={email}
        hideIdentityFields
      />
    </div>
  );
}
