'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';

export default function BookmarkPracticePage() {
  const router = useRouter();
  const {
    session, currentIndex, answers, isRunning, isSubmitting, isSubmitted, result, submitError, timeRemainingSeconds,
    selectAnswer, goToQuestion, nextQuestion, prevQuestion, submitExam, tick,
  } = useExamStore();

  useEffect(() => {
    if (!isRunning) return;
    const i = setInterval(() => tick(), 1000);
    return () => clearInterval(i);
  }, [isRunning, tick]);

  useEffect(() => {
    if (isSubmitted && result) {
      router.push(`/results/${result.result_id}`);
    }
  }, [isSubmitted, result, router]);

  if (!session) {
    return (
      <div className="page-wrap max-w-xl">
        <div className="card p-8 text-center">
          <p className="text-sm text-[var(--muted)]">No bookmark practice session found.</p>
          <a href="/bookmarks" className="btn-primary mt-4 inline-flex">Back to Bookmarks</a>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="page-wrap max-w-xl">
        <div className="card p-8 text-center">
          <p className="text-sm text-[var(--muted)]">Submitting practice…</p>
        </div>
      </div>
    );
  }

  const q = session.questions[currentIndex];
  if (!q) return null;
  const ans = answers.get(q._id);
  const mins = Math.floor(timeRemainingSeconds / 60);
  const secs = timeRemainingSeconds % 60;

  return (
    <div className="page-wrap max-w-3xl space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">Bookmark Practice</h1>
          <p className="text-sm text-[var(--muted)]">Question {currentIndex + 1} / {session.questions.length}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-bold text-[var(--text)]">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</p>
          <button onClick={() => submitExam()} className="btn-primary text-sm mt-1">Submit</button>
        </div>
      </div>

      <div className="card p-5">
        <p className="text-[var(--text)] leading-relaxed">{q.question_text}</p>
      </div>

      <div className="space-y-2">
        {q.options.map((opt: any) => (
          <button
            key={opt.index}
            onClick={() => selectAnswer(q._id, opt.index)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${ans?.selected_option === opt.index ? 'border-blue-400 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200' : 'border-[var(--line)] text-[var(--text)]'}`}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + opt.index)}.</span>
            {opt.text}
          </button>
        ))}
      </div>

      <div className="card p-3">
        <div className="grid grid-cols-10 gap-1.5 mb-3">
          {session.questions.map((item: any, i: number) => {
            const answered = answers.get(item._id)?.selected_option !== null;
            return (
              <button
                key={item._id}
                onClick={() => goToQuestion(i)}
                className={`h-8 rounded text-xs ${i === currentIndex ? 'bg-blue-600 text-white' : answered ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-[var(--muted)]'}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => prevQuestion()} disabled={currentIndex === 0} className="btn-secondary text-sm disabled:opacity-50">← Prev</button>
          <button onClick={() => nextQuestion()} disabled={currentIndex === session.questions.length - 1} className="btn-secondary text-sm disabled:opacity-50">Next →</button>
        </div>
      </div>
      {submitError && (
        <p className="text-sm text-red-500">{submitError}</p>
      )}
    </div>
  );
}
