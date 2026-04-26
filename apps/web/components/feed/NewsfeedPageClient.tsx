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
  const [pastWeeklyOpen, setPastWeeklyOpen] = useState(false);

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
      <section className="card glass overflow-hidden p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                <div className="grid gap-3 lg:grid-cols-2">
                  <WeeklyMockCard data={feedQuery.data} isLoading={feedQuery.isLoading} />
                  <PastWeeklyMockLauncher
                    data={feedQuery.data}
                    isLoading={feedQuery.isLoading}
                    open={pastWeeklyOpen}
                    setOpen={setPastWeeklyOpen}
                  />
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
      </section>
    </div>
  );
}

function WeeklyMockCard({ data, isLoading }: { data: any; isLoading: boolean }) {
  const weeklyMock = data?.weekly?.weeklyMock;
  if (isLoading) return <MotivationalLoadingCard label="Preparing your weekly challenge" />;

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

  if (!weeklyMock.can_attempt) {
    const attempted = Boolean(weeklyMock.already_attempted);
    return (
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)]/90 p-4 shadow-lg shadow-blue-500/5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <AppIcon name="mock" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={attempted ? 'badge-green' : 'badge-amber'}>{attempted ? 'Attempt completed' : 'Weekly mock locked'}</span>
            <span className="mt-2 block font-semibold text-[var(--text)]">{weeklyMock.title}</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
              {attempted
                ? 'Your ranked attempt is saved. Rankings publish after midnight NPT, then this test appears in Past Weekly Mocks for normal practice.'
                : `Opens only on ${weeklyMock.attempt_date} for focused exam-day discipline. Results publish after the day closes.`}
            </span>
            <Link href="/planner" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
              Prepare with planner
              <AppIcon name="arrow-right" className="h-3.5 w-3.5" />
            </Link>
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link href={weeklyMock.href} className="group block rounded-3xl border border-[var(--brand)]/45 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_38%),var(--bg-elev)] p-4 shadow-lg shadow-blue-500/10 transition-colors hover:border-[var(--brand)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <AppIcon name="mock" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">Weekly mock test</span>
          <span className="mt-2 block font-semibold text-[var(--text)]">{weeklyMock.title}</span>
          <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
            Today only · {weeklyMock.total_questions} questions · {weeklyMock.duration_minutes} min
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

function PastWeeklyMockLauncher({
  data,
  isLoading,
  open,
  setOpen,
}: {
  data: any;
  isLoading: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const pastMocks = Array.isArray(data?.weekly?.pastWeeklyMocks) ? data.weekly.pastWeeklyMocks : [];
  if (isLoading || pastMocks.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4 text-left transition-colors hover:border-[var(--brand)]/50 hover:bg-[var(--brand-soft)]/25"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <AppIcon name="mock" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[var(--text)]">Past weekly mock tests</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
              Practice expired weekly sets without scheduled ranking pressure.
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
              Open past mocks
              <AppIcon name="arrow-right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            aria-label="Close past weekly mocks"
            onClick={() => setOpen(false)}
          />
          <section className="absolute inset-x-3 top-8 mx-auto flex max-h-[86dvh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Expired weekly tests</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--text)]">Past Weekly Mocks</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">These are normal mock attempts. Scheduled ranks only count on the original Saturday.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary !px-3 !py-2 text-xs">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-3">
                {pastMocks.map((mock: any) => (
                  <Link
                    key={`${mock._id}-${mock.week_end}`}
                    href={mock.href}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/55 p-4 transition-colors hover:border-[var(--brand)]/50 hover:bg-[var(--brand-soft)]/20"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[var(--brand)]">{mock.week_start} to {mock.week_end}</p>
                        <h3 className="mt-1 font-semibold text-[var(--text)]">{mock.title}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{mock.total_questions} questions · {mock.duration_minutes} min</p>
                      </div>
                      <span className="btn-primary !px-3 !py-2 text-xs">Attempt</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function WeeklyResultCard({ data, isLoading }: { data: any; isLoading: boolean }) {
  const [open, setOpen] = useState(false);
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
    <>
      <div className="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="badge-green">Published weekly ranking</span>
            <h2 className="mt-2 font-semibold text-[var(--text)]">{published.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Attempt date {published.attempt_date ?? published.week_end} · Published {published.published_at_label}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(true)} className="btn-primary text-xs">
              Open rankings
            </button>
            <Link href="/leaderboard" className="btn-secondary text-xs">Full leaderboard</Link>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Participants</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text)]">{published.total_attempts}</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Top score</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text)]">
              {published.rows?.[0] ? `${published.rows[0].score}/${published.rows[0].max_score}` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Fastest top run</p>
            <p className="mt-1 text-2xl font-bold text-[var(--text)]">
              {published.rows?.[0] ? formatDuration(published.rows[0].total_time_seconds) : '—'}
            </p>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[95]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            aria-label="Close weekly ranking"
            onClick={() => setOpen(false)}
          />
          <section className="absolute inset-x-3 top-6 bottom-6 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Weekly ranking published</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--text)]">{published.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Attempt date {published.attempt_date ?? published.week_end} · Published {published.published_at_label}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary !px-3 !py-2 text-xs">
                Close
              </button>
            </div>

            <div className="grid gap-3 border-b border-[var(--line)] p-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/55 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Participants</p>
                <p className="mt-1 text-xl font-bold text-[var(--text)]">{published.total_attempts}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/55 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Visible rows</p>
                <p className="mt-1 text-xl font-bold text-[var(--text)]">{published.rows?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/55 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Top accuracy</p>
                <p className="mt-1 text-xl font-bold text-emerald-600">{published.rows?.[0]?.accuracy_percent ?? 0}%</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="hidden md:block">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="sticky top-0 bg-[var(--bg-elev)]">
                    <tr className="border-b border-[var(--line)]">
                      {['Rank', 'User', 'Email', 'Score', 'Accuracy', 'Time'].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {published.rows.map((row: any) => (
                      <tr key={row.result_id} className="hover:bg-[var(--brand-soft)]/20">
                        <td className="px-4 py-3 font-bold text-[var(--text)]">#{row.rank}</td>
                        <td className="px-4 py-3 font-medium text-[var(--text)]">{row.user_name}</td>
                        <td className="px-4 py-3 text-xs text-[var(--muted)]">{row.user_email}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--text)]">{row.score}/{row.max_score}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">{row.accuracy_percent}%</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{formatDuration(row.total_time_seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {published.rows.map((row: any) => (
                  <div key={row.result_id} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text)]">#{row.rank} {row.user_name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)] break-all">{row.user_email}</p>
                      </div>
                      <span className="badge-green">{row.accuracy_percent}%</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-[var(--bg-elev)] px-3 py-2">
                        <p className="text-[var(--muted)]">Score</p>
                        <p className="mt-1 font-semibold text-[var(--text)]">{row.score}/{row.max_score}</p>
                      </div>
                      <div className="rounded-xl bg-[var(--bg-elev)] px-3 py-2">
                        <p className="text-[var(--muted)]">Time</p>
                        <p className="mt-1 font-semibold text-[var(--text)]">{formatDuration(row.total_time_seconds)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const MOTIVATION_QUOTES = [
  'Small daily practice beats last-minute panic.',
  'One honest review today saves ten wrong answers later.',
  'Discipline turns preparation into confidence.',
];

function MotivationalLoadingCard({ label }: { label: string }) {
  const quote = MOTIVATION_QUOTES[new Date().getDate() % MOTIVATION_QUOTES.length];
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-[var(--brand-soft)]" />
        <span className="min-w-0 flex-1">
          <span className="block h-4 w-44 animate-pulse rounded bg-[var(--line)]" />
          <span className="mt-3 block text-sm font-medium text-[var(--text)]">{label}</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{quote}</span>
        </span>
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
    return <MotivationalLoadingCard label="Loading today’s focused question" />;
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
