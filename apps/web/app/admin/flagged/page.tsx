import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';

async function getFlaggedQueue() {
  await connectDB();
  const results = await Result.find({ 'answers.flagged': true })
    .sort({ created_at: -1 })
    .limit(120)
    .select('answers user_id test_id exam_id created_at test_type score max_score')
    .populate('user_id', 'name email')
    .populate('test_id', 'title')
    .populate('exam_id', 'name')
    .populate({ path: 'answers.question_id', model: 'Question', select: 'question_text difficulty subject_id', populate: { path: 'subject_id', select: 'name' } })
    .lean();

  return results.flatMap((result: any) =>
    (result.answers ?? [])
      .filter((answer: any) => answer.flagged && answer.question_id)
      .map((answer: any) => ({
        resultId: String(result._id),
        questionId: String(answer.question_id?._id ?? ''),
        questionText: answer.question_id?.question_text ?? 'Question text unavailable',
        difficulty: answer.question_id?.difficulty ?? 'medium',
        subjectName: answer.question_id?.subject_id?.name ?? 'Unknown subject',
        userName: result.user_id?.name ?? 'Unknown user',
        userEmail: result.user_id?.email ?? '',
        testTitle: result.test_id?.title ?? 'Practice Session',
        examName: result.exam_id?.name ?? 'Unknown exam',
        score: result.score,
        maxScore: result.max_score,
        createdAt: result.created_at,
      }))
  );
}

export default async function AdminFlaggedPage() {
  const flaggedItems = await getFlaggedQueue();

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Flagged Review Queue</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Questions users explicitly flagged during attempts, with direct paths to attempt review and question editing.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Flagged Items', value: flaggedItems.length, tone: 'text-amber-600' },
          { label: 'Unique Attempts', value: new Set(flaggedItems.map((item) => item.resultId)).size, tone: 'text-blue-600' },
          { label: 'Unique Questions', value: new Set(flaggedItems.map((item) => item.questionId)).size, tone: 'text-emerald-600' },
          { label: 'Recent Review Window', value: '120', tone: 'text-purple-600' },
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
            <h2 className="font-semibold text-[var(--text)] text-sm">Review Queue</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Open the attempt for context or jump straight into the question editor.</p>
          </div>
          <Link href="/admin/results" className="text-xs text-[var(--brand)] hover:underline">
            Open all results
          </Link>
        </div>

        {flaggedItems.length === 0 ? (
          <div className="px-4 md:px-6 py-6 text-sm text-[var(--muted)]">No flagged questions yet.</div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {flaggedItems.map((item) => (
              <div key={`${item.resultId}-${item.questionId}`} className="px-4 md:px-6 py-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`badge text-[10px] ${item.difficulty === 'easy' ? 'badge-green' : item.difficulty === 'medium' ? 'badge-amber' : 'badge-red'}`}>{item.difficulty}</span>
                      <span className="badge-amber">Flagged</span>
                      <span className="text-xs text-[var(--muted)]">{item.subjectName}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--text)]">{item.questionText}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {item.userName} {item.userEmail ? `(${item.userEmail})` : ''} · {item.testTitle} · {item.examName}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Attempt score {item.score}/{item.maxScore} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link href={`/admin/results/${item.resultId}`} className="btn-secondary text-xs px-3 py-2">
                      View Attempt
                    </Link>
                    <Link href={`/admin/questions?open=bank&questionId=${item.questionId}&mode=edit`} className="btn-primary text-xs px-3 py-2">
                      Edit Question
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
