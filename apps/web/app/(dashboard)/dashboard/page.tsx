import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Result, User, StudyPlan } from '@psc/shared/models';
import { generateAnalytics } from '@psc/shared/utils/analytics';
import Link from 'next/link';
import { DashboardCharts } from '@/components/analytics/DashboardCharts';
import { AppIcon } from '@/components/icons/AppIcon';

async function getData(userId: string) {
  await connectDB();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const [results, user, plan] = await Promise.all([
    Result.find({ user_id: userId }).sort({ created_at: -1 }).limit(20)
      .populate('test_id', 'title').lean(),
    User.findById(userId).select('name stats').lean(),
    StudyPlan.findOne({ user_id: userId, is_active: true })
      .populate('exam_id', 'name').lean(),
  ]);
  const drillsToday = await Result.countDocuments({
    user_id: userId,
    test_type: 'practice',
    created_at: { $gte: start, $lte: end },
    total_time_seconds: { $lte: 300 },
  });
  return { results, user, plan, drillsToday };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { results, user, plan, drillsToday } = await getData(session.user.id);
  const u = user as any;
  const analytics = generateAnalytics(results as any);
  const firstName = u?.name?.split(' ')[0] ?? 'there';
  const streak = u?.stats?.current_streak ?? 0;

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
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Your Command Center</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mt-1">Hello, {firstName}</h1>
            <p className="text-sm text-[var(--muted)] mt-2">
              {streak > 0
                ? `You are on a ${streak}-day streak. Stay consistent and keep momentum high.`
                : 'Start a practice session today to begin your streak and unlock momentum.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/exams" className="btn-primary">Start Practice</Link>
            <Link href="/mock" className="btn-secondary">Take Mock Test</Link>
            <Link href="/planner" className="btn-secondary">Open Planner</Link>
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
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">Quick Drill</h2>
            <p className="text-sm text-[var(--muted)] mt-1">5 questions in 5 minutes. {drillsToday} completed today.</p>
          </div>
          <Link href="/drill" className="btn-primary">Start Speed Drill</Link>
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
              {analytics.insights.map((ins, i) => (
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
                      name={ins.type === 'weakness' ? 'alert' : ins.type === 'strength' ? 'check' : ins.type === 'milestone' ? 'leaderboard' : 'idea'}
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
              {analytics.weak_topics.slice(0, 6).map((topic) => (
                <div key={topic.subject_id} className="flex items-center gap-3">
                  <span className="text-red-400 shrink-0"><AppIcon name="alert" className="h-4 w-4" /></span>
                  <span className="text-sm text-[var(--text)] flex-1 truncate">{topic.subject_name}</span>
                  <div className="w-28 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${topic.avg_accuracy}%` }} />
                  </div>
                  <span className="text-xs text-red-500 font-semibold w-9 text-right shrink-0">{topic.avg_accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan ? (
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Active Study Plan</h2>
              <Link href="/planner" className="text-xs text-[var(--brand)] hover:opacity-90">View full plan →</Link>
            </div>
            <p className="text-base font-semibold text-[var(--text)] mt-3">{(plan as any).exam_id?.name}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="badge-amber inline-flex items-center gap-1.5"><AppIcon name="drill" className="h-3.5 w-3.5" /> {(plan as any).streak_days} day streak</span>
              <span className="badge-gray inline-flex items-center gap-1.5"><AppIcon name="planner" className="h-3.5 w-3.5" /> Target: {new Date((plan as any).target_date).toLocaleDateString()}</span>
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

      {results.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--line)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">Recent Test Attempts</h2>
            <span className="text-xs text-[var(--muted)]">Last {Math.min(results.length, 5)} records</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {(results as any[]).slice(0, 5).map((r) => {
              const pct = ((r.score / r.max_score) * 100).toFixed(0);
              return (
                <Link
                  key={r._id}
                  href={`/results/${r._id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--brand-soft)]/45 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{r.test_id?.title ?? 'Practice Session'}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {new Date(r.created_at).toLocaleDateString()} · {r.correct_count} correct · {r.wrong_count} wrong · {r.skipped_count} skipped
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${Number(pct) >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</span>
                    <p className="text-xs text-[var(--muted)]">{r.accuracy_percent}% accuracy</p>
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
