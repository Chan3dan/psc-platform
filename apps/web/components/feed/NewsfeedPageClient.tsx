'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';
import { formatDuration } from '@/lib/results';

type FeedTab = 'latest' | 'question' | 'more';

const TABS: Array<{ id: FeedTab; label: string; helper: string }> = [
  { id: 'latest', label: 'Latest Updates', helper: 'Plan, revision, and study nudges' },
  { id: 'question', label: 'Question of the Day', helper: 'One focused daily MCQ' },
  { id: 'more', label: 'More', helper: 'Shortcuts and next actions' },
];

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function NewsfeedPageClient() {
  const [activeTab, setActiveTab] = useState<FeedTab>('latest');
  const [questionOfDay, setQuestionOfDay] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const feedQuery = useQuery({
    queryKey: ['newsfeed-weekly'],
    queryFn: async () => {
      const response = await fetch('/api/feed', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const payload = await readJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Could not load weekly feed.');
      }
      return payload.data;
    },
    retry: 1,
    staleTime: 60_000,
  });

  const questionQuery = useQuery({
    queryKey: ['newsfeed-question-of-day'],
    queryFn: async () => {
      const response = await fetch('/api/question-of-day', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const payload = await readJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Question of the day is not ready yet.');
      }
      return payload.data;
    },
    retry: 1,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!questionQuery.data) return;
    setQuestionOfDay(questionQuery.data);
    setSelectedOption(questionQuery.data?.attempt?.selected_option ?? null);
  }, [questionQuery.data]);

  const submitQuestion = useMutation({
    mutationFn: async () => {
      if (!questionOfDay?._id || selectedOption === null) {
        throw new Error('Choose one option first.');
      }

      const response = await fetch('/api/question-of-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          question_of_day_id: questionOfDay._id,
          selected_option: selectedOption,
          time_spent_seconds: 45,
        }),
      });
      const payload = await readJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Could not submit today’s question.');
      }
      return payload?.data?.questionOfDay ?? null;
    },
    onSuccess: (nextQuestion) => {
      setQuestionOfDay(nextQuestion);
      setSelectedOption(nextQuestion?.attempt?.selected_option ?? null);
    },
  });

  const question = questionOfDay?.question ?? null;
  const options = Array.isArray(question?.options) ? question.options : [];

  return (
    <div className="page-wrap space-y-5">
      <section className="card glass overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.86fr,1.14fr]">
          <div className="min-h-[220px] border-b border-[var(--line)] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_38%),linear-gradient(145deg,var(--brand-soft),transparent)] p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">Newsfeed</p>
            <h1 className="mt-3 text-3xl font-bold text-[var(--text)]">Today’s study stream</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
              Dashboard stays light. Your daily question, latest updates, and quick learning actions live here.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="badge-blue">Daily</span>
              <span className="badge-amber">Exam focused</span>
              <span className="badge-gray">Low friction</span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text)] shadow-lg shadow-blue-500/10'
                        : 'border-[var(--line)] bg-[var(--bg-elev)]/80 text-[var(--muted)] hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span className="mt-1 block text-xs">{tab.helper}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              {activeTab === 'latest' && (
                <div className="grid gap-3">
                  <WeeklyMockCard data={feedQuery.data} isLoading={feedQuery.isLoading} />
                  <WeeklyResultCard data={feedQuery.data} isLoading={feedQuery.isLoading} />
                  <FeedCard
                    icon="planner"
                    title="Planner verification moved out of dashboard"
                    body="Use the planner for strict progress checks. Dashboard now only shows the snapshot."
                    href="/planner"
                    cta="Open planner"
                  />
                  <FeedCard
                    icon="bookmarks"
                    title="Review queue is your score-leak list"
                    body="Wrong, skipped, and flagged questions are grouped for focused revision."
                    href="/review"
                    cta="Review now"
                  />
                  <FeedCard
                    icon="notes"
                    title="Notes and syllabus are kept in the study area"
                    body="Open notes when you want reading mode instead of mixing it into the dashboard."
                    href="/notes"
                    cta="Open notes"
                  />
                </div>
              )}

              {activeTab === 'question' && (
                <DailyQuestionCard
                  isLoading={questionQuery.isLoading}
                  error={questionQuery.isError ? (questionQuery.error as Error).message : ''}
                  questionOfDay={questionOfDay}
                  question={question}
                  options={options}
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                  submitQuestion={submitQuestion}
                />
              )}

              {activeTab === 'more' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FeedCard icon="drill" title="5-minute speed drill" body="Warm up quickly without starting a full test." href="/drill" cta="Start drill" />
                  <FeedCard icon="mock" title="Full mock mode" body="Use this when you want proper exam pressure and timer flow." href="/mock" cta="Take mock" />
                  <FeedCard icon="leaderboard" title="Leaderboard" body="Compare consistency and performance with other learners." href="/leaderboard" cta="View rank" />
                  <FeedCard icon="results" title="Results history" body="Filter attempts and open detailed review pages." href="/results" cta="View results" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function WeeklyMockCard({ data, isLoading }: { data: any; isLoading: boolean }) {
  const weeklyMock = data?.weekly?.weeklyMock;
  if (isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-[var(--brand-soft)]/20" />;

  if (!weeklyMock) {
    return (
      <FeedCard
        icon="mock"
        title="Weekly mock test"
        body="A weekly test will appear here after an active mock test is added for your selected exam."
        href="/mock"
        cta="Browse mocks"
      />
    );
  }

  return (
    <Link href={weeklyMock.href} className="group block rounded-3xl border border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-lg shadow-blue-500/10 transition-colors hover:border-blue-500 dark:border-blue-900 dark:from-blue-950/50 dark:to-cyan-950/30">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <AppIcon name="mock" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="badge-blue">Weekly mock test</span>
          <span className="mt-2 block font-semibold text-[var(--text)]">{weeklyMock.title}</span>
          <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
            {weeklyMock.week_start} to {weeklyMock.week_end} · {weeklyMock.total_questions} questions · {weeklyMock.duration_minutes} min
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
            Start weekly mock
            <AppIcon name="arrow-right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  );
}

function WeeklyResultCard({ data, isLoading }: { data: any; isLoading: boolean }) {
  const published = data?.weekly?.publishedResult;
  if (isLoading) return null;

  if (!published || published.total_attempts === 0) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <AppIcon name="leaderboard" className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-[var(--text)]">Weekly result publishing</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
              Rankings publish automatically after the weekly mock window closes at midnight NPT.
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="badge-green">Published weekly ranking</span>
          <h2 className="mt-2 font-semibold text-[var(--text)]">{published.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Week {published.week_start} to {published.week_end} · Published {published.published_at_label}
          </p>
        </div>
        <Link href="/leaderboard" className="btn-secondary text-xs">Full leaderboard</Link>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/80">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-[var(--brand-soft)]/35">
            <tr>
              {['Rank', 'User', 'Score', 'Accuracy', 'Time'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {published.rows.slice(0, 5).map((row: any) => (
              <tr key={row.result_id}>
                <td className="px-4 py-3 font-bold text-[var(--text)]">#{row.rank}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text)]">{row.user_name}</p>
                  <p className="text-xs text-[var(--muted)]">{row.user_email}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.score}/{row.max_score}</td>
                <td className="px-4 py-3 text-emerald-600 font-semibold">{row.accuracy_percent}%</td>
                <td className="px-4 py-3 text-[var(--muted)]">{formatDuration(row.total_time_seconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedCard({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: any;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4 transition-colors hover:border-[var(--brand)]/50 hover:bg-[var(--brand-soft)]/25">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <AppIcon name={icon} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-[var(--text)]">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{body}</span>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
            {cta}
            <AppIcon name="arrow-right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  );
}

function DailyQuestionCard({
  isLoading,
  error,
  questionOfDay,
  question,
  options,
  selectedOption,
  setSelectedOption,
  submitQuestion,
}: {
  isLoading: boolean;
  error: string;
  questionOfDay: any;
  question: any;
  options: any[];
  selectedOption: number | null;
  setSelectedOption: (value: number) => void;
  submitQuestion: any;
}) {
  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-[var(--brand-soft)]/20" />;
  }

  if (error || !questionOfDay || !question) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
          <AppIcon name="alert" className="h-6 w-6" />
        </div>
        <h2 className="font-semibold text-[var(--text)]">Question is not ready yet</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{error || 'Select an exam focus first, then come back to the feed.'}</p>
        <Link href="/settings" className="btn-secondary mt-4">Check exam focus</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Question of the Day</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--text)]">{questionOfDay.subject?.name ?? 'Daily practice'}</h2>
        </div>
        {questionOfDay.attempt && <span className="badge-green">Completed</span>}
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
        <p className="text-sm font-medium leading-6 text-[var(--text)]">{question.question_text}</p>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => {
          const optionIndex = Number.isFinite(Number(option?.index)) ? Number(option.index) : index;
          const locked = Boolean(questionOfDay.attempt);
          const correct = locked && question.correct_answer === optionIndex;
          const wrongPick = locked && questionOfDay.attempt?.selected_option === optionIndex && question.correct_answer !== optionIndex;
          const selected = selectedOption === optionIndex;

          return (
            <button
              key={`${optionIndex}-${option?.text ?? index}`}
              type="button"
              disabled={locked}
              onClick={() => setSelectedOption(optionIndex)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                correct
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : wrongPick
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : selected
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--text)]'
                      : 'border-[var(--line)] bg-[var(--bg-elev)]/80 text-[var(--text)] hover:border-[var(--brand)]/45'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Option {String.fromCharCode(65 + optionIndex)}</span>
              <span className="mt-1 block text-sm">{String(option?.text ?? '')}</span>
            </button>
          );
        })}
      </div>

      {questionOfDay.attempt ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/20 p-4">
          <p className="text-sm font-semibold text-[var(--text)]">Correct answer: Option {String.fromCharCode(65 + Number(question.correct_answer ?? 0))}</p>
          {question.explanation && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{question.explanation}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-500">{submitQuestion.isError ? (submitQuestion.error as Error).message : ''}</p>
          <button
            type="button"
            onClick={() => submitQuestion.mutate()}
            disabled={selectedOption === null || submitQuestion.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {submitQuestion.isPending ? 'Submitting...' : 'Submit answer'}
          </button>
        </div>
      )}
    </div>
  );
}
