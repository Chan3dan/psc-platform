'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon } from '@/components/icons/AppIcon';

interface ActiveExam {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

interface Track {
  slug: string;
  name: string;
  shortName: string;
  status: 'live' | 'coming_soon';
  description: string;
}

export function ExamPreferenceSelector({
  activeExams,
  tracks,
  currentExamId,
  userName = '',
  userEmail = '',
  title = 'Choose your target exam',
  description = 'We will tailor your dashboard, practice, mocks, notes, and planner to the exam you are actually preparing for.',
  compact = false,
}: {
  activeExams: ActiveExam[];
  tracks: Track[];
  currentExamId?: string | null;
  userName?: string;
  userEmail?: string;
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [selectedExamId, setSelectedExamId] = useState(currentExamId ?? activeExams[0]?._id ?? '');
  const [requestExamName, setRequestExamName] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedExamId(currentExamId ?? activeExams[0]?._id ?? '');
  }, [activeExams, currentExamId]);

  async function saveSelection() {
    if (!selectedExamId) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_exam_id: selectedExamId }),
      });
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error ?? 'Could not save your exam preference');
      }
      setNotice('Your exam focus has been updated.');
      if (!currentExamId) {
        router.replace('/dashboard');
      } else {
        router.refresh();
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not save your exam preference');
    } finally {
      setSaving(false);
    }
  }

  async function submitRequest(examName: string) {
    setSubmittingRequest(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'exam_request',
          exam_slug: examName.toLowerCase().replace(/\s+/g, '-'),
          exam_name: examName,
          name: userName.trim(),
          email: userEmail.trim(),
          message:
            requestMessage.trim() ||
            `Please add ${examName} as a preparation track with practice, notes, mock tests, and analytics.`,
        }),
      });
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error ?? 'Could not submit your request');
      }
      setNotice(`Request sent for ${examName}. We will review it from the admin panel.`);
      setRequestExamName(examName);
      setRequestMessage('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not submit your request');
    } finally {
      setSubmittingRequest(false);
    }
  }

  return (
    <section className={`card ${compact ? 'p-5' : 'glass p-6 md:p-7'} space-y-6`}>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
          <AppIcon name="exams" className="h-3.5 w-3.5" />
          Exam Focus
        </div>
        <h2 className="text-2xl font-semibold text-[var(--text)]">{title}</h2>
        <p className="text-sm text-[var(--muted)] max-w-3xl">{description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {activeExams.map((exam) => {
              const selected = selectedExamId === exam._id;
              return (
                <button
                  key={exam._id}
                  type="button"
                  onClick={() => setSelectedExamId(exam._id)}
                  className={`rounded-3xl border p-4 text-left transition-all ${
                    selected
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)] shadow-[var(--shadow-soft)]'
                      : 'border-[var(--line)] bg-[var(--bg-elev)] hover:border-[var(--brand)]/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--text)]">{exam.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)] line-clamp-3">{exam.description}</p>
                    </div>
                    <span className="badge-blue shrink-0">Live</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[var(--brand)]">
                    {selected ? 'Selected for your account' : 'Select this exam'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveSelection}
              disabled={!selectedExamId || saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : currentExamId ? 'Update my exam' : 'Continue with this exam'}
            </button>
            {currentExamId ? (
              <p className="text-xs text-[var(--muted)]">You can switch your target exam here whenever your preparation changes.</p>
            ) : (
              <p className="text-xs text-[var(--muted)]">This sets your default dashboard and study experience.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text)]">Coming soon tracks</h3>
            <div className="mt-3 space-y-3">
              {tracks
                .filter((track) => track.status === 'coming_soon')
                .map((track) => (
                  <div key={track.slug} className="rounded-2xl border border-[var(--line)] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--text)]">{track.name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{track.description}</p>
                      </div>
                      <span className="badge-amber shrink-0">Coming soon</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestExamName(track.name);
                        setRequestMessage(`Please add ${track.name} as an exam preparation track.`);
                      }}
                      className="mt-3 text-xs font-semibold text-[var(--brand)] hover:underline"
                    >
                      Request this exam
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">Need another exam?</h3>
            <p className="text-xs text-[var(--muted)]">
              Ask the admin to add your target exam. Mention the post name so the platform can prioritize demand.
            </p>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/25 px-3 py-2 text-xs text-[var(--muted)]">
              Request will be sent as <span className="font-semibold text-[var(--text)]">{userName || 'your account'}</span>
              {userEmail ? ` (${userEmail})` : ''}.
            </div>
            <input
              className="input"
              placeholder="Requested exam name"
              value={requestExamName}
              onChange={(event) => setRequestExamName(event.target.value)}
            />
            <textarea
              className="input min-h-[112px]"
              placeholder="Example: Please add NaSu with syllabus, notes, mock tests, and section-wise practice."
              value={requestMessage}
              onChange={(event) => setRequestMessage(event.target.value)}
            />
            <button
              type="button"
              onClick={() => void submitRequest(requestExamName.trim())}
              disabled={submittingRequest || !requestExamName.trim() || !requestMessage.trim()}
              className="btn-secondary w-full"
            >
              {submittingRequest ? 'Sending request...' : 'Send exam request'}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{notice}</p>
      ) : null}
    </section>
  );
}
