import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { formatDuration } from '@/lib/results';

async function getResults(userId: string) {
  await connectDB();
  return Result.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(150)
    .populate('test_id', 'title')
    .populate('exam_id', 'name')
    .lean();
}

export default async function ResultsHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const results = await getResults(session.user.id) as any[];
  const avgAccuracy = results.length > 0
    ? Math.round(results.reduce((sum, result) => sum + Number(result.accuracy_percent ?? 0), 0) / results.length)
    : 0;
  const flaggedAttempts = results.filter((result) => (result.answers ?? []).some((answer: any) => answer.flagged)).length;

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Results</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Review your recent mock tests and practice attempts in one place.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Attempts', value: results.length, tone: 'text-blue-600' },
          { label: 'Average Accuracy', value: `${avgAccuracy}%`, tone: 'text-emerald-600' },
          { label: 'Flagged Attempts', value: flaggedAttempts, tone: 'text-amber-600' },
          { label: 'Latest Duration', value: results[0] ? formatDuration(results[0].total_time_seconds) : '—', tone: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 md:p-5">
            <div className={`text-xl md:text-2xl font-bold ${stat.tone}`}>{stat.value}</div>
            <div className="text-xs md:text-sm text-[var(--muted)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)]">
          <h2 className="font-semibold text-[var(--text)] text-sm">Attempt History</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">Click any attempt to open its full review page.</p>
        </div>

        {results.length === 0 ? (
          <div className="px-4 md:px-6 py-8 text-sm text-[var(--muted)]">
            No results yet. Start a practice session or mock test to populate this history.
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {results.map((result: any) => {
              const flaggedCount = (result.answers ?? []).filter((answer: any) => answer.flagged).length;
              const pct = result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0;
              return (
                <Link
                  key={result._id}
                  href={`/results/${result._id}`}
                  className="block px-4 md:px-6 py-4 hover:bg-[var(--brand-soft)]/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="badge-gray">{result.test_type}</span>
                        {flaggedCount > 0 && <span className="badge-amber">{flaggedCount} flagged</span>}
                        <span className="text-xs text-[var(--muted)]">{result.exam_id?.name ?? 'Unknown exam'}</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--text)]">{result.test_id?.title ?? 'Practice Session'}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        {formatDuration(result.total_time_seconds)} · {result.correct_count} correct · {result.wrong_count} wrong · {result.skipped_count} skipped
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className={`text-sm font-semibold ${pct >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{result.score}/{result.max_score}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{new Date(result.created_at).toLocaleDateString()} · {result.accuracy_percent}% accuracy</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
