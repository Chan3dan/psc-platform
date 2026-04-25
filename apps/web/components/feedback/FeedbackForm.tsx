'use client';

import { useState } from 'react';

export function FeedbackForm({
  title = 'Share feedback',
  description = 'Tell us what is working, what feels slow, or which exam track you want next.',
  defaultCategory = 'general',
  defaultMessage = '',
  compact = false,
}: {
  title?: string;
  description?: string;
  defaultCategory?: 'general' | 'bug' | 'feature' | 'exam_request';
  defaultMessage?: string;
  compact?: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: defaultCategory,
    exam_name: '',
    message: defaultMessage,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error ?? 'Could not send feedback');
      }
      setNotice('Thanks. Your feedback was sent successfully.');
      setForm((current) => ({
        ...current,
        exam_name: '',
        message: '',
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not send feedback');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`card ${compact ? 'p-5' : 'p-6 md:p-7'} space-y-4`}>
      <div>
        <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="input"
          placeholder="Your name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <input
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[0.9fr,1.1fr]">
        <select
          className="input"
          value={form.category}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              category: event.target.value as typeof current.category,
            }))
          }
        >
          <option value="general">General feedback</option>
          <option value="feature">Feature idea</option>
          <option value="bug">Bug report</option>
          <option value="exam_request">Request an exam</option>
        </select>
        <input
          className="input"
          placeholder="Requested exam (optional)"
          value={form.exam_name}
          onChange={(event) => setForm((current) => ({ ...current, exam_name: event.target.value }))}
        />
      </div>

      <textarea
        className="input min-h-[140px]"
        placeholder="Tell us what you need. Example: Please add NaSu with topic-wise practice, syllabus PDF, notes, and full mock tests."
        value={form.message}
        onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
      />

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{notice}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">Exam requests go straight to the admin inbox.</p>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Sending...' : 'Send feedback'}
        </button>
      </div>
    </form>
  );
}
