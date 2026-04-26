'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';
import { cachePracticeQuestions, readCachedPracticeQuestions } from '@/lib/offline-question-cache';

type Mode = 'setup' | 'practice';

export default function PracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('setup');
  const [settings, setSettings] = useState({ count: 20, difficulty: '' });
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [revealed, setRevealed] = useState<Record<string, { correct_answer: number; explanation: string }>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [deepLinkConsumed, setDeepLinkConsumed] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const examSlug = String(params.exam ?? '');
  const subjectSlug = String(params.subject ?? '');
  const focusQuestionId = searchParams.get('question_id') ?? '';

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const { data: subjectInfo } = useQuery({
    queryKey: ['subject-info', examSlug, subjectSlug],
    queryFn: async () => {
      const res = await fetch(`/api/subjects?exam_slug=${examSlug}`);
      const d = await res.json();
      return d.data?.find((s: any) => s.slug === subjectSlug);
    },
    enabled: Boolean(examSlug && subjectSlug),
  });

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
        // ignore for guests/not-logged-in users
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

  async function start(firstQuestionId?: string) {
    setError('');
    setLoadingStart(true);
    setOfflineMode(false);
    const cacheSuffix = `${settings.count}:${settings.difficulty || 'all'}:${firstQuestionId || 'regular'}`;

    async function startFromCache(message?: string) {
      const cached = await readCachedPracticeQuestions({ examSlug, subjectSlug, suffix: cacheSuffix });
      if (!cached?.questions?.length) {
        setError(
          message ??
            'You are offline and this practice set is not cached on this device yet. Load it once while online.'
        );
        return false;
      }
      setQuestions(cached.questions);
      setIdx(0);
      setAnswers({});
      setRevealed({});
      setOfflineMode(true);
      setMode('practice');
      return true;
    }

    try {
      if (!subjectInfo) {
        await startFromCache('Subject details are unavailable offline. Cached questions will appear after you load this practice once online.');
        return;
      }

      let qs: any[] = [];
      if (firstQuestionId) {
        const firstRes = await fetch(`/api/questions?subject_id=${subjectInfo._id}&question_id=${encodeURIComponent(firstQuestionId)}&limit=1`);
        if (!firstRes.ok) throw new Error('Could not load the requested question.');
        const firstData = await firstRes.json();
        const firstList = firstData.data?.data ?? firstData.data ?? [];
        const first = Array.isArray(firstList) ? firstList[0] : null;
        if (first) qs.push(first);
      }

      const remaining = Math.max(0, settings.count - qs.length);
      if (remaining > 0) {
        const p = new URLSearchParams({ random: 'true', limit: String(remaining) });
        if (settings.difficulty) p.set('difficulty', settings.difficulty);
        if (qs.length) p.set('exclude_ids', qs.map((x) => x._id).join(','));
        const res = await fetch(`/api/questions?subject_id=${subjectInfo._id}&${p}`);
        if (!res.ok) throw new Error('Could not load questions.');
        const d = await res.json();
        const randomQs = d.data?.data ?? d.data ?? [];
        if (Array.isArray(randomQs)) qs = [...qs, ...randomQs];
      }

      if (!Array.isArray(qs) || qs.length === 0) {
        setError('No questions found for this subject/difficulty. Try Mixed difficulty or add more questions.');
        return;
      }
      await cachePracticeQuestions({
        examSlug,
        subjectSlug,
        suffix: cacheSuffix,
        label: subjectInfo?.name ?? subjectSlug,
        questions: qs,
      }).catch(() => undefined);
      setQuestions(qs);
      setIdx(0); setAnswers({}); setRevealed({});
      setMode('practice');
    } catch {
      await startFromCache(
        navigator.onLine
          ? 'Could not load fresh questions. Showing cached questions if available.'
          : 'You are offline. Showing cached questions if available.'
      );
    } finally { setLoadingStart(false); }
  }

  useEffect(() => {
    if (!subjectInfo || !focusQuestionId || deepLinkConsumed) return;
    setDeepLinkConsumed(true);
    start(focusQuestionId);
  }, [subjectInfo, focusQuestionId, deepLinkConsumed]);

  async function reveal(qId: string) {
    const res = await fetch(`/api/questions/${qId}/answer`);
    const d = await res.json();
    if (d.success) {
      setRevealed(r => ({ ...r, [qId]: d.data }));
      const sel = answers[qId];
      if (sel !== undefined && sel !== null) {
        fetch(`/api/questions/${qId}/attempt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selected_option: sel }) });
      }
    }
  }

  if (mode === 'setup') return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="mb-6">
        <Link href={`/exams/${params.exam}`} className="text-sm text-[var(--muted)] transition hover:text-[var(--text)]">Back to exam</Link>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">{subjectInfo?.name ?? 'Practice'}</h1>
        <p className="text-sm text-gray-500 mt-1">{subjectInfo?.question_count ?? 0} questions available</p>
        {!isOnline && (
          <p className="text-xs text-amber-600 mt-1">Offline mode is available for practice sets loaded before.</p>
        )}
        {focusQuestionId && (
          <p className="text-xs text-blue-600 mt-1">Opened from search. Matching question will be shown first.</p>
        )}
      </div>
      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Number of questions</label>
          <div className="flex gap-2">
            {[10, 20, 30, 50].map(n => (
              <button key={n} onClick={() => setSettings(s => ({ ...s, count: n }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settings.count === n ? 'bg-blue-600 text-white' : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--brand-soft)]/35'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Difficulty</label>
          <div className="flex gap-2">
            {[['', 'All'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([v, l]) => (
              <button key={v} onClick={() => setSettings(s => ({ ...s, difficulty: v }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settings.difficulty === v ? 'bg-blue-600 text-white' : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--brand-soft)]/35'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button onClick={() => start(focusQuestionId || undefined)} disabled={!subjectInfo || loadingStart} className="btn-primary w-full py-3 disabled:opacity-50">
          {loadingStart ? 'Loading questions…' : 'Start Practice'}
        </button>
      </div>
    </div>
  );

  const q = questions[idx];
  if (!q) return null;
  const rev = revealed[q._id];
  const sel = answers[q._id];
  const isBookmarked = bookmarkedIds.has(q._id);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500 shrink-0">{idx + 1} / {questions.length}</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--line)]/65">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
        <span className={`badge text-xs shrink-0 ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-amber' : 'badge-red'}`}>{q.difficulty}</span>
        {offlineMode && (
          <span className="badge badge-amber text-xs shrink-0">Offline mode</span>
        )}
        <button
          onClick={() => toggleBookmark(q._id)}
          disabled={bookmarkBusy}
          className={`text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
            isBookmarked
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-[var(--line)] bg-[var(--bg-elev)] text-[var(--text)]'
          } disabled:opacity-60`}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <span className="inline-flex items-center gap-1.5">
            <AppIcon name="bookmarks" className="h-3.5 w-3.5" />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </span>
        </button>
      </div>

      <div className="card p-6 mb-4">
        <p className="leading-relaxed text-[var(--text)]">{q.question_text}</p>
        {q.question_image_url && <img src={q.question_image_url} alt="Question" className="mt-4 rounded-lg max-h-48 object-contain" />}
      </div>

      <div className="space-y-3 mb-6">
        {q.options.map((opt: any) => {
          let cls = 'border-[var(--line)] bg-[var(--bg-elev)] text-[var(--text)]';
          if (rev) {
            if (opt.index === rev.correct_answer) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
            else if (opt.index === sel && opt.index !== rev.correct_answer) cls = 'border-red-400 bg-red-50 text-red-700';
          } else if (sel === opt.index) {
            cls = 'border-blue-400 bg-[var(--brand-soft)]/60 text-[var(--brand)]';
          }
          return (
            <button key={opt.index} disabled={!!rev}
              onClick={() => setAnswers(a => ({ ...a, [q._id]: opt.index }))}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm disabled:cursor-default ${cls} ${!rev && sel !== opt.index ? 'hover:bg-[var(--brand-soft)]/25' : ''}`}>
              <span className="font-medium mr-3">{String.fromCharCode(65 + opt.index)}.</span>
              {opt.text}
              {rev && opt.index === rev.correct_answer && <span className="float-right text-emerald-600"><AppIcon name="check" className="h-4 w-4 inline-block" /></span>}
              {rev && opt.index === sel && opt.index !== rev.correct_answer && <span className="float-right text-red-500"><AppIcon name="alert" className="h-4 w-4 inline-block" /></span>}
            </button>
          );
        })}
      </div>

      {rev?.explanation && (
        <div className="card mb-4 border-l-4 border-blue-400 bg-[var(--brand-soft)]/40 p-4">
          <p className="mb-1 text-xs font-semibold text-[var(--brand)]">Explanation</p>
          <p className="text-sm text-[var(--text)]">{rev.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="btn-secondary disabled:opacity-40">Previous</button>
        {!rev
          ? <button onClick={() => reveal(q._id)} disabled={sel === undefined || sel === null} className="btn-primary disabled:opacity-40">Check Answer</button>
          : <button onClick={() => { if (idx === questions.length - 1) setMode('setup'); else setIdx(i => i + 1); }} className="btn-primary">
              {idx === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
        }
      </div>
    </div>
  );
}
