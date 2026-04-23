'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DashboardCharts } from '@/components/analytics/DashboardCharts';
import { AppIcon } from '@/components/icons/AppIcon';
import { formatDuration } from '@/lib/results';

function DashboardLoadingState() {
  return (
    <div className="page-wrap space-y-6">
      <section className="card glass p-6 md:p-7">
        <div className="space-y-3">
          <div className="h-6 w-40 rounded-full bg-[var(--brand-soft)]/70 animate-pulse" />
          <div className="h-10 w-64 rounded-2xl bg-[var(--line)] animate-pulse" />
          <div className="h-5 w-full max-w-xl rounded-xl bg-[var(--line)] animate-pulse" />
        </div>
      </section>
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-4 space-y-2">
            <div className="h-4 w-20 rounded bg-[var(--line)] animate-pulse" />
            <div className="h-8 w-24 rounded bg-[var(--line)] animate-pulse" />
          </div>
        ))}
      </section>
      <section className="card p-5 h-32 animate-pulse bg-[var(--brand-soft)]/15" />
    </div>
  );
}

export function DashboardPageClient() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/summary');
      const payload = await response.json();
      return payload.data;
    },
    staleTime: 45_000,
    gcTime: 5 * 60_000,
  });

  if (isLoading || !data) {
    return <DashboardLoadingState />;
  }

  const analytics = data.analytics;
  const engagement = data.engagement ?? {};
  const firstName = data.user?.name?.split?.(' ')?.[0] ?? 'there';
  const streak = data.user?.stats?.current_streak ?? 0;
  const readinessScore = Number(engagement.readinessScore ?? 0);

  const statCards = [
    { label: 'Tests Taken', value: analytics.total_tests, tone: 'text-blue-600' },
    { label: 'Avg Score', value: `${analytics.avg_score_percent}%`, tone: 'text-emerald-600' },
    { label: 'Accuracy', value: `${analytics.overall_accuracy}%`, tone: 'text-indigo-600' },
    { label: 'Questions Solved', value: analytics.total_questions.toLocaleString(), tone: 'text-amber-600' },
  ];

  return (
    <div className="page-wrap space-y-6">
      <section className="card glass p-6 md:p-7">
        <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
              <AppIcon name="dashboard" className="h-3.5 w-3.5" />
              Your Command Center
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mt-1">Hello, {firstName}</h1>
            <p className="text-sm text-[var(--muted)] mt-2">
              {streak > 0
                ? `You are on a ${streak}-day streak. Stay consistent and keep momentum high.`
                : 'Start a practice session today to begin your streak and unlock momentum.'}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge-amber inline-flex items-center gap-1.5">
                <AppIcon name="leaderboard" className="h-3.5 w-3.5" />
                {streak} day streak
              </span>
              <span className="badge-gray inline-flex items-center gap-1.5">
                <AppIcon name="analytics" className="h-3.5 w-3.5" />
                {analytics.total_tests} tests tracked
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/exams" className="btn-primary inline-flex items-center gap-2">
              <AppIcon name="practice" className="h-4 w-4" />
              Start Practice
            </Link>
            <Link href="/mock" className="btn-secondary inline-flex items-center gap-2">
              <AppIcon name="mock" className="h-4 w-4" />
              Take Mock Test
            </Link>
            <Link href="/planner" className="btn-secondary inline-flex items-center gap-2">
              <AppIcon name="planner" className="h-4 w-4" />
              Open Planner
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.85fr,1.15fr] gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-[var(--muted)]">Exam Readiness</p>
              <h2 className="mt-1 text-3xl font-bold text-[var(--text)]">{readinessScore}%</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Based on accuracy, mock attempts, consistency, and review backlog.
              </p>
            </div>
            <span className={`badge ${readinessScore >= 70 ? 'badge-green' : readinessScore >= 45 ? 'badge-amber' : 'badge-red'}`}>
              {readinessScore >= 70 ? 'Ready' : readinessScore >= 45 ? 'Building' : 'Needs focus'}
            </span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Link href="/review" className="rounded-xl border border-[var(--line)] px-3 py-2 hover:bg-[var(--brand-soft)]/45">
              {engagement.reviewQueueCount ?? 0} review items
            </Link>
            <Link href="/mock" className="rounded-xl border border-[var(--line)] px-3 py-2 hover:bg-[var(--brand-soft)]/45">
              {engagement.weeklyMockCount ?? 0} mocks this week
            </Link>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Today’s Learning Missions</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">Small daily actions that compound into exam confidence.</p>
            </div>
            <Link href="/review" className="hidden sm:inline-flex text-xs text-[var(--brand)] hover:underline">Smart review</Link>
          </div>
          <div className="space-y-3">
            {(engagement.dailyMissions ?? []).map((mission: any) => (
              <Link key={mission.id} href={mission.href} className="block rounded-2xl border border-[var(--line)] p-3 hover:border-[var(--brand)]/50 hover:bg-[var(--brand-soft)]/25 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl ${mission.completed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}>
                    <AppIcon name={mission.completed ? 'check' : mission.type === 'mock' ? 'mock' : mission.type === 'review' ? 'bookmarks' : 'drill'} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--text)]">{mission.title}</span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">{mission.description}</span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <span className={`block h-full rounded-full ${mission.completed ? 'bg-emerald-500' : 'bg-[var(--brand)]'}`} style={{ width: `${mission.progress ?? 0}%` }} />
                    </span>
                  </span>
                  <span className={`badge shrink-0 ${mission.completed ? 'badge-green' : 'badge-blue'}`}>{mission.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--text)]">Quick Drill</h2>
            <p className="text-sm text-[var(--muted)] mt-1">5 questions in 5 minutes. {data.drillsToday} completed today.</p>
          </div>
          <Link href="/drill" className="btn-primary inline-flex items-center gap-2">
            <AppIcon name="drill" className="h-4 w-4" />
            Start Speed Drill
          </Link>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">Milestone Rewards</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Achievement signals that keep preparation motivating.</p>
          </div>
          <Link href="/results" className="text-xs text-[var(--brand)] hover:underline">View progress</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(engagement.milestones ?? []).map((milestone: any) => (
            <div key={milestone.label} className="rounded-2xl border border-[var(--line)] p-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${milestone.completed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  <AppIcon name={milestone.completed ? 'check' : 'leaderboard'} className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-medium text-[var(--text)]">{milestone.label}</p>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">{milestone.completed ? 'Unlocked' : `${Math.round(milestone.progress ?? 0)}% progress`}</p>
            </div>
          ))}
        </div>
      </section>


      <section className="grid grid-cols-1 xl:grid-cols-[1.25fr,0.75fr] gap-4">
        {analytics.insights.length > 0 ? (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Performance Insights</h2>
              <span className="badge-blue">{analytics.insights.length} insights</span>
            </div>
            <div className="space-y-2.5">
              {analytics.insights.map((ins: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2.5 text-sm flex items-start gap-2 ${
                    ins.type === 'weakness'
                      ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                      : ins.type === 'strength'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : ins.type === 'milestone'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    <AppIcon
                      name={
                        ins.type === 'weakness'
                          ? 'alert'
                          : ins.type === 'strength'
                            ? 'check'
                            : ins.type === 'milestone'
                              ? 'leaderboard'
                              : 'idea'
                      }
                      className="h-4 w-4"
                    />
                  </span>
                  <span>{ins.message}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)]">Performance Insights</h2>
            <p className="text-sm text-[var(--muted)] mt-2">Complete a few tests to generate personalized insight cards.</p>
          </div>
        )}

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--text)]">Quick Actions</h2>
          <div className="mt-3 space-y-2">
            <Link href="/practice" className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--brand-soft)]/50 transition-colors">
              Practice by subject <AppIcon name="arrow-right" className="h-4 w-4" />
            </Link>
            <Link href="/leaderboard" className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--brand-soft)]/50 transition-colors">
              Check leaderboard <AppIcon name="arrow-right" className="h-4 w-4" />
            </Link>
            <Link href="/notes" className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--brand-soft)]/50 transition-colors">
              Revise notes <AppIcon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {analytics.score_history.length > 1 && (
        <DashboardCharts scoreHistory={analytics.score_history} subjectPerformance={analytics.subject_performance} />
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analytics.weak_topics.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Priority Weak Topics</h2>
            <div className="space-y-2.5">
              {analytics.weak_topics.slice(0, 6).map((topic: any) => (
                <div key={topic.subject_id} className="rounded-2xl border border-[var(--line)] p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 shrink-0"><AppIcon name="alert" className="h-4 w-4" /></span>
                    <span className="text-sm font-medium text-[var(--text)] flex-1 truncate">{topic.subject_name}</span>
                    <span className="text-xs text-red-500 font-semibold shrink-0">{topic.avg_accuracy}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${topic.avg_accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.plan ? (
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Active Study Plan</h2>
              <Link href="/planner" className="inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:opacity-90">
                View full plan
                <AppIcon name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-base font-semibold text-[var(--text)] mt-3">{data.plan.examName}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="badge-amber inline-flex items-center gap-1.5"><AppIcon name="drill" className="h-3.5 w-3.5" /> {data.plan.streakDays} day streak</span>
              <span className="badge-gray inline-flex items-center gap-1.5"><AppIcon name="planner" className="h-3.5 w-3.5" /> Target: {data.plan.targetDate ? new Date(data.plan.targetDate).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)]">No Active Study Plan</h2>
            <p className="text-sm text-[var(--muted)] mt-2">Create a plan to get a personalized day-by-day preparation roadmap.</p>
            <Link href="/planner" className="btn-secondary mt-4">Create Plan</Link>
          </div>
        )}
      </section>

      {data.recentResults.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--line)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">Recent Test Attempts</h2>
            <Link href="/results" className="text-xs text-[var(--brand)] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {data.recentResults.map((result: any) => {
              const pct = result.maxScore > 0 ? ((result.score / result.maxScore) * 100).toFixed(0) : '0';
              return (
                <Link
                  key={result._id}
                  href={`/results/${result._id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--brand-soft)]/45 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{result.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {formatDuration(result.totalTimeSeconds)} · {result.correctCount} correct · {result.wrongCount} wrong · {result.skippedCount} skipped
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${Number(pct) >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</span>
                    <p className="text-xs text-[var(--muted)]">{new Date(result.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card p-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <AppIcon name="notes" className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-[var(--text)] mb-1">No attempts yet</h3>
          <p className="text-sm text-[var(--muted)] mb-4">Start a practice set or mock test to unlock analytics and insight tracking.</p>
          <Link href="/exams" className="btn-primary inline-flex">Begin Practice</Link>
        </section>
      )}
    </div>
  );
}
