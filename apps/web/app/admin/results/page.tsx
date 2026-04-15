import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { formatDuration } from '@/lib/results';

async function getResults() {
  await connectDB();
  return Result.find({})
    .sort({ created_at: -1 })
    .limit(150)
    .populate('user_id', 'name email')
    .populate('test_id', 'title')
    .populate('exam_id', 'name')
    .lean();
}

export default async function AdminResultsPage() {
  const results = await getResults() as any[];
  const flaggedAttempts = results.filter((result) => (result.answers ?? []).some((answer: any) => answer.flagged)).length;
  const mockAttempts = results.filter((result) => result.test_type === 'mock').length;
  const practiceAttempts = results.filter((result) => result.test_type === 'practice').length;

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Results</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Review recent attempts, scores, and flagged questions across the platform.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Recent Attempts', value: results.length, tone: 'text-blue-600' },
          { label: 'Flagged Attempts', value: flaggedAttempts, tone: 'text-amber-600' },
          { label: 'Mock Attempts', value: mockAttempts, tone: 'text-emerald-600' },
          { label: 'Practice Attempts', value: practiceAttempts, tone: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 md:p-5">
            <div className={`text-xl md:text-2xl font-bold ${stat.tone}`}>{stat.value}</div>
            <div className="text-xs md:text-sm text-[var(--muted)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--text)] text-sm">Attempt Queue</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Latest 150 attempts with direct review links.</p>
          </div>
          <Link href="/admin/flagged" className="text-xs text-[var(--brand)] hover:underline">
            Open flagged queue
          </Link>
        </div>

        <div className="md:hidden divide-y divide-[var(--line)]">
          {results.map((result: any) => {
            const flaggedCount = (result.answers ?? []).filter((answer: any) => answer.flagged).length;
            return (
              <Link key={result._id} href={`/admin/results/${result._id}`} className="block px-4 py-3 space-y-2 hover:bg-[var(--brand-soft)]/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text)] truncate">{result.test_id?.title ?? 'Practice Session'}</p>
                    <p className="text-xs text-[var(--muted)] truncate mt-0.5">{result.user_id?.name ?? 'Unknown user'} · {result.exam_id?.name ?? 'Unknown exam'}</p>
                  </div>
                  <span className={`badge text-xs ${flaggedCount > 0 ? 'badge-amber' : 'badge-gray'}`}>
                    {flaggedCount > 0 ? `${flaggedCount} flagged` : result.test_type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{formatDuration(result.total_time_seconds)} · {new Date(result.created_at).toLocaleDateString()}</span>
                  <span className="font-semibold text-[var(--text)]">{result.score}/{result.max_score}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm min-w-[920px]">
            <thead className="bg-[var(--brand-soft)]/35">
              <tr>
                {['Attempt', 'User', 'Exam', 'Type', 'Score', 'Flagged', 'Submitted', 'View'].map((heading) => (
                  <th key={heading} className="text-left px-6 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {results.map((result: any) => {
                const flaggedCount = (result.answers ?? []).filter((answer: any) => answer.flagged).length;
                return (
                  <tr key={result._id} className="hover:bg-[var(--brand-soft)]/25">
                    <td className="px-6 py-3 font-medium text-[var(--text)]">{result.test_id?.title ?? 'Practice Session'}</td>
                    <td className="px-6 py-3 text-[var(--muted)]">{result.user_id?.name ?? 'Unknown user'}</td>
                    <td className="px-6 py-3 text-[var(--muted)]">{result.exam_id?.name ?? 'Unknown exam'}</td>
                    <td className="px-6 py-3"><span className="badge-gray">{result.test_type}</span></td>
                    <td className="px-6 py-3 text-[var(--text)] font-semibold">{result.score}/{result.max_score}</td>
                    <td className="px-6 py-3">
                      <span className={`badge ${flaggedCount > 0 ? 'badge-amber' : 'badge-gray'}`}>{flaggedCount}</span>
                    </td>
                    <td className="px-6 py-3 text-[var(--muted)]">{formatDuration(result.total_time_seconds)} · {new Date(result.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <Link href={`/admin/results/${result._id}`} className="text-[var(--brand)] font-medium hover:underline">Review</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
