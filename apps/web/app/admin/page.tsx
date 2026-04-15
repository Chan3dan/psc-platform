import { connectDB } from '@/lib/db';
import { Exam, Question, User, Result } from '@psc/shared/models';
import Link from 'next/link';
import { AppIcon } from '@/components/icons/AppIcon';
import { formatResultDateTime } from '@/lib/results';

export default async function AdminPage() {
  await connectDB();
  const [examCount, questionCount, userCount, resultCount, recentUsers, flaggedCountAgg, recentFlaggedResults] = await Promise.all([
    Exam.countDocuments({ is_active: true }),
    Question.countDocuments({ is_active: true }),
    User.countDocuments({ is_active: true }),
    Result.countDocuments({}),
    User.find({}).sort({ created_at: -1 }).limit(8).select('name email created_at role').lean(),
    Result.aggregate([
      { $unwind: '$answers' },
      { $match: { 'answers.flagged': true } },
      { $count: 'total' },
    ]),
    Result.find({ 'answers.flagged': true })
      .sort({ created_at: -1 })
      .limit(8)
      .select('answers user_id test_id created_at')
      .populate('user_id', 'name email')
      .populate('test_id', 'title')
      .populate({ path: 'answers.question_id', model: 'Question', select: 'question_text' })
      .lean(),
  ]);
  const flaggedCount = flaggedCountAgg[0]?.total ?? 0;
  const recentFlaggedQuestions = (recentFlaggedResults as any[])
    .flatMap((result) =>
      (result.answers ?? [])
        .filter((answer: any) => answer.flagged && answer.question_id)
        .map((answer: any) => ({
          resultId: String(result._id),
          questionId: String(answer.question_id?._id ?? ''),
          questionText: answer.question_id?.question_text ?? 'Question text unavailable',
          userName: result.user_id?.name ?? 'Unknown user',
          testTitle: result.test_id?.title ?? 'Practice Session',
          createdAt: result.created_at,
        }))
    )
    .slice(0, 6);

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Overview</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Platform statistics and quick actions.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Active Exams', value: examCount, href: '/admin/exams', color: 'text-blue-600' },
          { label: 'Questions', value: questionCount.toLocaleString(), href: '/admin/questions', color: 'text-emerald-600' },
          { label: 'Users', value: userCount.toLocaleString(), href: '/admin/users', color: 'text-purple-600' },
          { label: 'Test Attempts', value: resultCount.toLocaleString(), href: '/admin/results', color: 'text-orange-600' },
          { label: 'Flagged Reviews', value: flaggedCount.toLocaleString(), href: '/admin/flagged', color: 'text-amber-600' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="card p-4 md:p-5">
            <div className={`text-xl md:text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs md:text-sm text-[var(--muted)] mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[
          { href: '/admin/exams', label: 'Add New Exam', desc: 'Create a new PSC exam type', icon: 'exams' },
          { href: '/admin/questions', label: 'Upload Questions', desc: 'Bulk upload MCQ bank via JSON', icon: 'upload' },
          { href: '/admin/notes', label: 'Upload Notes', desc: 'Add PDFs and study materials', icon: 'notes' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="card p-4 md:p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <AppIcon name={a.icon as any} className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-[var(--text)] text-sm">{a.label}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--text)] text-sm">Flagged By Users</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Recent questions users marked for review during tests.</p>
          </div>
          <Link href="/admin/flagged" className="text-xs text-[var(--brand)] hover:underline">
            Open flagged queue
          </Link>
        </div>
        {recentFlaggedQuestions.length === 0 ? (
          <div className="px-4 md:px-6 py-5 text-sm text-[var(--muted)]">
            No flagged questions yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {recentFlaggedQuestions.map((item) => (
              <div key={`${item.resultId}-${item.questionId}`} className="px-4 md:px-6 py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] line-clamp-2">{item.questionText}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {item.userName} · {item.testTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge badge-amber text-xs">Flagged</span>
                    <Link
                      href={`/admin/questions?open=bank&questionId=${item.questionId}&mode=edit`}
                      className="text-xs text-[var(--brand)] hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {formatResultDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)]">
          <h2 className="font-semibold text-[var(--text)] text-sm">Recent Registrations</h2>
        </div>
        <div className="md:hidden divide-y divide-[var(--line)]">
          {(recentUsers as any[]).map((u) => (
            <div key={u._id} className="px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text)] truncate">{u.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate mt-0.5">{u.email}</p>
                </div>
                <span className={`badge text-xs ${u.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' : 'badge-gray'}`}>
                  {u.role}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">Joined {new Date(u.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--brand-soft)]/35">
              <tr>
                {['Name', 'Email', 'Role', 'Joined'].map(h => (
                  <th key={h} className="text-left px-6 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {(recentUsers as any[]).map(u => (
                <tr key={u._id} className="hover:bg-[var(--brand-soft)]/25">
                  <td className="px-6 py-2.5 font-medium text-[var(--text)]">{u.name}</td>
                  <td className="px-6 py-2.5 text-[var(--muted)]">{u.email}</td>
                  <td className="px-6 py-2.5">
                    <span className={`badge ${u.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' : 'badge-gray'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-2.5 text-[var(--muted)]">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
