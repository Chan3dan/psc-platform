'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useExamStore } from '@/store/examStore';

export default function DrillPage() {
  const [examId, setExamId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const {
    session, currentIndex, answers, isRunning, isSubmitted, isSubmitting, result,
    submitError, timeRemainingSeconds, startSession, selectAnswer, nextQuestion, tick, submitExam, reset,
  } = useExamStore();

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const r = await fetch('/api/exams');
      const d = await r.json();
      return d.data ?? [];
    },
  });

  const { data: drillStats, refetch: refetchDrillStats } = useQuery({
    queryKey: ['drill-stats'],
    queryFn: async () => {
      const r = await fetch('/api/drill/stats');
      const d = await r.json();
      return d.success ? d.data : { drills_today: 0 };
    },
  });

  useEffect(() => {
    if (!isRunning) return;
    const i = setInterval(() => tick(), 1000);
    return () => clearInterval(i);
  }, [isRunning, tick]);

  useEffect(() => {
    if (isSubmitted) {
      refetchDrillStats();
    }
  }, [isSubmitted, refetchDrillStats]);

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
        setError(d?.error ?? 'Could not update bookmark.');
        return;
      }
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.delete(questionId);
        else next.add(questionId);
        return next;
      });
    } catch {
      setError('Could not update bookmark.');
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function startDrill() {
    if (!examId) return;
    setError('');
    setStarting(true);
    try {
      const payload = {
        test_type: 'practice',
        exam_id: examId,
        count: 5,
        difficulty: difficulty || undefined,
      };

      let r = await fetch('/api/tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let d = await r.json();

      // fallback to mixed if strict difficulty has no pool
      if (!d.success && difficulty) {
        r = await fetch('/api/tests/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, difficulty: undefined }),
        });
        d = await r.json();
        if (d.success) setDifficulty('');
      }

      if (!d.success) {
        setError(d.error ?? 'Could not start drill');
        return;
      }

      const data = d.data;
      const limited = (data.questions ?? []).slice(0, 5);
      if (limited.length < 5) {
        setError('Need at least 5 questions for drill.');
        return;
      }

      reset();
      startSession({
        ...data,
        config: {
          ...data.config,
          title: 'Speed Drill',
          duration_minutes: 5,
          total_questions: 5,
        },
        questions: limited,
      });
    } finally {
      setStarting(false);
    }
  }

  const q = session?.questions?.[currentIndex];
  const selected = q ? answers.get(q._id)?.selected_option : null;
  const isBookmarked = q ? bookmarkedIds.has(q._id) : false;
  const mins = Math.floor(timeRemainingSeconds / 60);
  const secs = timeRemainingSeconds % 60;
  const urgent = timeRemainingSeconds < 60;

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return session.questions.filter((x) => {
      const a = answers.get(x._id);
      return a && a.selected_option !== null;
    }).length;
  }, [session, answers]);

  const allAnswered = !!session && answeredCount === session.questions.length;

  useEffect(() => {
    if (!session || !allAnswered || isSubmitting || isSubmitted) return;
    submitExam();
  }, [session, allAnswered, isSubmitting, isSubmitted, submitExam]);

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚡</div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Speed Drill</h1>
          <p className="text-sm text-[var(--muted)] mt-2">5 questions · 5 minutes · instant results</p>
          <p className="text-sm text-emerald-600 mt-2">
            {(drillStats?.drills_today ?? 0)} drills completed today 🔥
          </p>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Select Exam</label>
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className="input">
              <option value="">Choose exam…</option>
              {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Difficulty</label>
            <div className="flex gap-2">
              {[['', 'Mixed'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setDifficulty(v)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${difficulty === v ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{error}</p>}
          <button onClick={startDrill} disabled={!examId || starting} className="btn-primary w-full py-3">
            {starting ? 'Starting…' : 'Start Drill ⚡'}
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--muted)]">Submitting drill…</p>
      </div>
    );
  }

  if (isSubmitted && result) {
    return (
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Drill Complete</h2>
          <p className="text-sm text-[var(--muted)] mt-1">Instant results</p>
          <p className="text-2xl font-bold text-emerald-600 mt-4">
            {result.score.toFixed(2)} / {result.max_score.toFixed(2)}
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">{result.accuracy_percent}% accuracy</p>
          <p className="text-sm text-emerald-600 mt-3">
            {(drillStats?.drills_today ?? 0)} drills completed today 🔥
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                reset();
                setError('');
              }}
              className="btn-primary flex-1"
            >
              Try Again
            </button>
            <a href="/dashboard" className="btn-secondary flex-1 text-center">Back</a>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <div className={`text-center mb-5 text-4xl font-mono font-bold tabular-nums ${urgent ? 'text-red-500 animate-pulse' : 'text-[var(--text)]'}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        <p className="text-sm font-normal text-[var(--muted)] mt-1">
          {urgent ? '⏰ Less than 60s left!' : `Question ${currentIndex + 1} of 5`}
        </p>
      </div>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[var(--text)] leading-relaxed">{q.question_text}</p>
          <button
            onClick={() => toggleBookmark(q._id)}
            disabled={bookmarkBusy}
            className={`text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
              isBookmarked
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-gray-300 bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700'
            } disabled:opacity-60`}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {q.options.map((opt: any) => (
          <button
            key={opt.index}
            onClick={() => selectAnswer(q._id, opt.index)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${selected === opt.index ? 'border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200' : 'border-gray-200 dark:border-gray-700 text-[var(--text)]'}`}
          >
            <span className="font-medium mr-3">{String.fromCharCode(65 + opt.index)}.</span>
            {opt.text}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">{answeredCount}/5 answered</p>
        {currentIndex < 4 ? (
          <button
            onClick={() => nextQuestion()}
            disabled={selected === null || selected === undefined}
            className="btn-primary disabled:opacity-50"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => submitExam()}
            disabled={!allAnswered || isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            Finish ✓
          </button>
        )}
      </div>
      {submitError && (
        <p className="text-sm text-red-500 mt-3">{submitError}</p>
      )}
    </div>
  );
}
