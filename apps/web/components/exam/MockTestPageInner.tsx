'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';

const STATUS_COLOR: Record<string, string> = {
  answered: 'bg-emerald-500 text-white',
  flagged: 'bg-amber-400 text-white',
  skipped: 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
  'not-visited': 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400',
};

export function MockTestPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('test');

  const {
    session, currentIndex, answers, isSubmitted, isSubmitting, result,
    isRunning, timeRemainingSeconds,
    startSession, selectAnswer, clearAnswer, flagQuestion,
    goToQuestion, nextQuestion, prevQuestion, submitExam, tick, getStatus,
  } = useExamStore();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [bookmarkError, setBookmarkError] = useState('');

  // Load test on mount
  useEffect(() => {
    if (!testId) return;
    // Reset any previous session
    useExamStore.getState().reset();

    fetch('/api/tests/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_id: testId, test_type: 'mock' }),
    })
      .then(r => r.json())
      .then(d => { if (d.success) startSession(d.data); })
      .catch(console.error);

    // Warn user before leaving mid-test
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [testId]);

  useEffect(() => {
    let mounted = true;
    async function loadBookmarks() {
      try {
        const res = await fetch('/api/bookmarks');
        const d = await res.json();
        if (!mounted || !d?.success || !Array.isArray(d?.data)) return;
        const ids = d.data
          .map((x: any) => String(x?.question_id?._id ?? x?.question_id ?? ''))
          .filter(Boolean);
        setBookmarkedIds(new Set(ids));
      } catch {
        // ignore
      }
    }
    loadBookmarks();
    return () => {
      mounted = false;
    };
  }, []);

  async function toggleBookmark(questionId: string) {
    if (!questionId || bookmarkBusy) return;
    setBookmarkError('');
    setBookmarkBusy(true);
    try {
      const isBookmarked = bookmarkedIds.has(questionId);
      const res = await fetch('/api/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId }),
      });
      const d = await res.json();
      if (!d?.success) {
        setBookmarkError(d?.error ?? 'Could not update bookmark.');
        return;
      }
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.delete(questionId);
        else next.add(questionId);
        return next;
      });
    } catch {
      setBookmarkError('Could not update bookmark.');
    } finally {
      setBookmarkBusy(false);
    }
  }

  // Countdown timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Redirect to results when submitted
  useEffect(() => {
    if (isSubmitted && result) {
      router.push(`/results/${result.result_id}`);
    }
  }, [isSubmitted, result, router]);

  // Loading state
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          {!testId ? (
            <>
              <p className="text-red-500 font-medium">No test selected.</p>
              <a href="/exams" className="text-sm text-blue-600 mt-2 inline-block">← Browse Exams</a>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Preparing your test…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Submitting state
  if (isSubmitting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Submitting your answers…</p>
        </div>
      </div>
    );
  }

  const q = session.questions[currentIndex];
  if (!q) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="text-center">
          <p className="text-sm text-red-500 font-medium">Question could not be loaded for this index.</p>
          <p className="text-xs text-[var(--muted)] mt-1">Please submit and restart this test.</p>
        </div>
      </div>
    );
  }

  const ans = answers.get(q._id);
  const isBookmarked = bookmarkedIds.has(q._id);
  const mins = Math.floor(timeRemainingSeconds / 60);
  const secs = timeRemainingSeconds % 60;
  const isLow = timeRemainingSeconds < 300;
  const totalPct = (timeRemainingSeconds / (session.config.duration_minutes * 60)) * 100;
  const answeredCount = session.questions.filter((sq: any) => getStatus(sq._id) === 'answered').length;
  const flaggedCount = session.questions.filter((sq: any) => getStatus(sq._id) === 'flagged').length;
  const skippedCount = session.questions.filter((sq: any) => getStatus(sq._id) === 'skipped').length;
  const pendingCount = session.questions.filter((sq: any) => getStatus(sq._id) === 'not-visited').length;
  const completionPct = session.questions.length > 0 ? Math.round((answeredCount / session.questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border)] px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm text-[var(--text)] truncate">{session.config.title}</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Question {currentIndex + 1} of {session.questions.length} · {completionPct}% answered
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`font-mono font-bold text-lg tabular-nums transition-colors ${isLow ? 'text-red-500 animate-pulse' : 'text-[var(--text)]'}`}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : totalPct > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.max(0, totalPct)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Submit the test now? You cannot change answers after submitting.')) {
                submitExam();
              }
            }}
            className="btn-primary text-sm shrink-0"
          >
            Submit
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="badge badge-green text-xs">Answered: {answeredCount}</span>
          <span className="badge badge-amber text-xs">Flagged: {flaggedCount}</span>
          <span className="badge text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">Skipped: {skippedCount}</span>
          <span className="badge text-xs bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">Pending: {pendingCount}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── MAIN QUESTION AREA ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Difficulty badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`badge text-xs ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-amber' : 'badge-red'}`}>
                {q.difficulty}
              </span>
              <span className="text-xs text-[var(--muted)]">Question {currentIndex + 1}</span>
              {ans?.flagged && <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs">Flagged</span>}
            </div>

            {/* Question */}
            <div className="card glass p-5 mb-4">
              <p className="text-[var(--text)] leading-relaxed text-[15px]">{q.question_text ?? 'Question text unavailable.'}</p>
              {q.question_image_url && (
                <img src={q.question_image_url} alt="" className="mt-4 rounded-lg max-h-56 object-contain w-full bg-black/5 p-2" />
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt: any) => {
                const selected = ans?.selected_option === opt.index;
                return (
                  <button
                    key={opt.index}
                    onClick={() => selectAnswer(q._id, opt.index)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all
                      ${selected
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-medium shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/30'
                      }`}
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-bold shrink-0
                      ${selected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      {String.fromCharCode(65 + opt.index)}
                    </span>
                    {opt.text ?? 'Option text unavailable'}
                  </button>
                );
              })}
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2">
                <button
                  onClick={() => toggleBookmark(q._id)}
                  disabled={bookmarkBusy}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    isBookmarked
                      ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  } disabled:opacity-50`}
                >
                  {isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
                </button>
                <button
                  onClick={() => clearAnswer(q._id)}
                  disabled={!ans?.selected_option && ans?.selected_option !== 0}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
                >
                  Clear
                </button>
                <button
                  onClick={() => flagQuestion(q._id)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${ans?.flagged ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  {ans?.flagged ? 'Flagged' : 'Flag for review'}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={prevQuestion} disabled={currentIndex === 0}
                  className="btn-secondary text-sm disabled:opacity-40 py-1.5">← Prev</button>
                <button onClick={nextQuestion} disabled={currentIndex === session.questions.length - 1}
                  className="btn-secondary text-sm disabled:opacity-40 py-1.5">Next →</button>
              </div>
            </div>
            {bookmarkError && (
              <p className="text-xs text-red-500 mt-2">{bookmarkError}</p>
            )}

            <div className="lg:hidden mt-4 card p-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Quick Jump</p>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                {session.questions.map((sq: any, i: number) => {
                  const status = getStatus(sq._id);
                  return (
                    <button
                      key={sq._id}
                      onClick={() => goToQuestion(i)}
                      className={`w-8 h-8 text-xs rounded font-medium transition-all ${STATUS_COLOR[status]} ${currentIndex === i ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* ── QUESTION PALETTE SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-56 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Questions</h3>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {session.questions.map((sq: any, i: number) => {
              const status = getStatus(sq._id);
              return (
                <button
                  key={sq._id}
                  onClick={() => goToQuestion(i)}
                  title={`Q${i + 1} — ${status}`}
                  className={`w-8 h-8 text-xs rounded font-medium transition-all
                    ${STATUS_COLOR[status]}
                    ${currentIndex === i ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            {[
              ['bg-emerald-500', 'Answered'],
              ['bg-amber-400', 'Flagged'],
              ['bg-gray-300 dark:bg-gray-600', 'Skipped'],
            ].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded inline-block shrink-0 ${c}`} />
                {l}
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs">
            {(['answered', 'flagged', 'skipped', 'not-visited'] as const).map(s => {
              const count = session.questions.filter((sq: any) => getStatus(sq._id) === s).length;
              if (s === 'not-visited') return (
                <div key={s} className="flex justify-between text-gray-400">
                  <span>Not visited</span><span>{count}</span>
                </div>
              );
              return (
                <div key={s} className={`flex justify-between font-medium ${s === 'answered' ? 'text-emerald-600' : s === 'flagged' ? 'text-amber-600' : 'text-gray-400'}`}>
                  <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
