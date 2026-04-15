'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { AppIcon } from '@/components/icons/AppIcon';

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
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState<'prev' | 'next' | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!testId) return;
    useExamStore.getState().reset();

    fetch('/api/tests/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_id: testId, test_type: 'mock' }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) startSession(d.data); })
      .catch(console.error);

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

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    if (isSubmitted && result) {
      router.push(`/results/${result.result_id}`);
    }
  }, [isSubmitted, result, router]);

  useEffect(() => {
    if (!submitConfirmOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [submitConfirmOpen]);

  useEffect(() => {
    if (!quickJumpOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [quickJumpOpen]);

  useEffect(() => {
    if (!swipeFeedback) return;
    const timer = window.setTimeout(() => setSwipeFeedback(null), 220);
    return () => window.clearTimeout(timer);
  }, [swipeFeedback]);

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

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (!session) return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaY) > 40) return;

    if (deltaX < 0 && currentIndex < session.questions.length - 1) {
      setSwipeFeedback('next');
      nextQuestion();
    }

    if (deltaX > 0 && currentIndex > 0) {
      setSwipeFeedback('prev');
      prevQuestion();
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          {!testId ? (
            <>
              <p className="text-red-500 font-medium">No test selected.</p>
              <a href="/exams" className="text-sm text-blue-600 mt-2 inline-block">Browse Exams</a>
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
  const notVisitedCount = session.questions.filter((sq: any) => getStatus(sq._id) === 'not-visited').length;
  const completionPct = session.questions.length > 0 ? Math.round((answeredCount / session.questions.length) * 100) : 0;
  const statusLegend = [
    { label: 'Answered', dot: 'bg-emerald-500' },
    { label: 'Flagged', dot: 'bg-amber-400' },
    { label: 'Skipped', dot: 'bg-gray-400 dark:bg-gray-500' },
    { label: 'Not Visited', dot: 'border border-gray-400 dark:border-gray-500 bg-transparent' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-10 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border)] px-3 sm:px-4 md:px-6 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm text-[var(--text)] truncate">{session.config.title}</h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Question {currentIndex + 1} of {session.questions.length} · {completionPct}% answered
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-2">
            <div className="min-w-0 flex-1 sm:flex-none">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-mono font-bold text-lg tabular-nums transition-colors ${isLow ? 'text-red-500 animate-pulse' : 'text-[var(--text)]'}`}>
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </span>
                <span className="text-[11px] text-[var(--muted)] sm:hidden">Time left</span>
              </div>
              <div className="w-full sm:w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : totalPct > 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.max(0, totalPct)}%` }}
                />
              </div>
            </div>
            <button onClick={() => setSubmitConfirmOpen(true)} className="btn-primary text-sm shrink-0 min-w-[92px]">
              Submit
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="badge badge-green text-xs">Answered: {answeredCount}</span>
          <span className="badge badge-amber text-xs">Flagged: {flaggedCount}</span>
          <span className="badge text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">Skipped: {skippedCount}</span>
          <span className="badge text-xs bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">Not Visited: {notVisitedCount}</span>
        </div>

        <div className="mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap text-[11px] text-[var(--muted)]">
          {statusLegend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.dot}`} />
              {item.label}
            </span>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-40 md:pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`badge text-xs ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-amber' : 'badge-red'}`}>
                {q.difficulty}
              </span>
              <span className="text-xs text-[var(--muted)]">Question {currentIndex + 1}</span>
              <div className="ml-auto flex items-center gap-2">
                {ans?.flagged && <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs">Flagged</span>}
                <button
                  onClick={() => flagQuestion(q._id)}
                  title={ans?.flagged ? 'Flagged for review' : 'Flag for review'}
                  className={`inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${
                    ans?.flagged
                      ? 'border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800'
                  }`}
                  aria-label={ans?.flagged ? 'Question flagged for review' : 'Flag question for review'}
                >
                  <AppIcon name="alert" className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleBookmark(q._id)}
                  disabled={bookmarkBusy}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                  className={`inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${
                    isBookmarked
                      ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  } disabled:opacity-50`}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                >
                  <AppIcon name="bookmarks" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className="card glass p-4 md:p-5 mb-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <p className="text-[var(--text)] leading-relaxed text-[15px] break-words">{q.question_text ?? 'Question text unavailable.'}</p>
              {q.question_image_url && (
                <img src={q.question_image_url} alt="" className="mt-4 rounded-lg max-h-56 object-contain w-full bg-black/5 p-2" />
              )}
            </div>

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
                    <span className="flex items-start gap-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0
                        ${selected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {String.fromCharCode(65 + opt.index)}
                      </span>
                      <span className="min-w-0 break-words">{opt.text ?? 'Option text unavailable'}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => clearAnswer(q._id)}
                  disabled={!ans?.selected_option && ans?.selected_option !== 0}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 border border-transparent"
                >
                  Clear
                </button>
                <button
                  onClick={() => setQuickJumpOpen(true)}
                  className="text-sm px-3 py-2 rounded-lg transition-colors border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Quick Jump
                </button>
              </div>
              <div className="hidden lg:grid grid-cols-3 gap-2">
                <button onClick={prevQuestion} disabled={currentIndex === 0} className="btn-secondary text-sm disabled:opacity-40 py-2">
                  Previous
                </button>
                <button onClick={() => setQuickJumpOpen(true)} className="btn-secondary text-sm py-2">
                  Quick Jump
                </button>
                <button onClick={nextQuestion} disabled={currentIndex === session.questions.length - 1} className="btn-secondary text-sm disabled:opacity-40 py-2">
                  Next
                </button>
              </div>
            </div>

            {bookmarkError && <p className="text-xs text-red-500 mt-2">{bookmarkError}</p>}
          </div>
        </main>

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

          <div className="space-y-1.5 text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            {[
              ['bg-emerald-500', 'Answered'],
              ['bg-amber-400', 'Flagged'],
              ['bg-gray-300 dark:bg-gray-600', 'Skipped'],
              ['bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600', 'Not Visited'],
            ].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded inline-block shrink-0 ${c}`} />
                {l}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1 text-xs">
            {(['answered', 'flagged', 'skipped', 'not-visited'] as const).map((s) => {
              const count = session.questions.filter((sq: any) => getStatus(sq._id) === s).length;
              if (s === 'not-visited') {
                return (
                  <div key={s} className="flex justify-between text-gray-400">
                    <span>Not Visited</span><span>{count}</span>
                  </div>
                );
              }
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

      <div className="lg:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[35] px-3">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/96 backdrop-blur-md shadow-[var(--shadow-strong)] p-2">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              className="btn-secondary text-sm disabled:opacity-40 py-2"
            >
              Previous
            </button>
            <button
              onClick={() => clearAnswer(q._id)}
              disabled={!ans?.selected_option && ans?.selected_option !== 0}
              title="Clear selected answer"
              className="btn-secondary text-sm disabled:opacity-40 py-2 px-2"
            >
              <span className="inline-flex items-center justify-center">
                <AppIcon name="close" className="h-4 w-4" />
              </span>
            </button>
            <button
              onClick={() => setQuickJumpOpen(true)}
              className="btn-secondary text-sm py-2"
            >
              Jump to
            </button>
            <button
              onClick={nextQuestion}
              disabled={currentIndex === session.questions.length - 1}
              className="btn-secondary text-sm disabled:opacity-40 py-2"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {submitConfirmOpen && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSubmitConfirmOpen(false); }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[var(--bg-elev)] border border-[var(--line)] shadow-[var(--shadow-strong)] p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text)]">Submit test?</h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                You won’t be able to change answers after submission.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => setSubmitConfirmOpen(false)}>
                Keep reviewing
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setSubmitConfirmOpen(false);
                  submitExam();
                }}
              >
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}

      {quickJumpOpen && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-[2px] flex items-end lg:items-center justify-center p-0 lg:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setQuickJumpOpen(false); }}
        >
          <div className="w-full max-h-[72vh] lg:max-w-2xl rounded-t-3xl lg:rounded-3xl bg-[var(--bg-elev)] border border-[var(--line)] shadow-[var(--shadow-strong)] p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Quick Jump</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Swipe left or right on the question card to move faster.
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="badge badge-green text-xs">Answered: {answeredCount}</span>
                  <span className="badge badge-amber text-xs">Flagged: {flaggedCount}</span>
                  <span className="badge text-xs bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">Not Visited: {notVisitedCount}</span>
                </div>
              </div>
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setQuickJumpOpen(false)}>
                Close
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-1.5">
              {session.questions.map((sq: any, i: number) => {
                const status = getStatus(sq._id);
                return (
                  <button
                    key={sq._id}
                    onClick={() => {
                      goToQuestion(i);
                      setQuickJumpOpen(false);
                    }}
                    className={`w-full aspect-square text-xs rounded font-medium transition-all ${STATUS_COLOR[status]} ${currentIndex === i ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {swipeFeedback && (
        <div className="lg:hidden pointer-events-none fixed left-1/2 top-1/2 z-[85] -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-full bg-[var(--surface)]/96 px-4 py-2 text-sm font-medium text-[var(--text)] shadow-[var(--shadow-strong)] border border-[var(--line)]">
            {swipeFeedback === 'next' ? 'Next question' : 'Previous question'}
          </div>
        </div>
      )}
    </div>
  );
}
