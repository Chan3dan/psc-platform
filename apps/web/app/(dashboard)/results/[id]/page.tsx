import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import Link from 'next/link';
import { ResultReview } from '@/components/exam/ResultReview';

async function getResult(id: string, userId: string) {
  await connectDB();
  return Result.findOne({ _id: id, user_id: userId })
    .populate('test_id', 'title')
    .populate('exam_id', 'total_marks total_questions negative_marking')
    .populate({ path: 'answers.question_id', model: 'Question',
      select: 'question_text options correct_answer explanation subject_id difficulty',
      populate: { path: 'subject_id', select: 'name' } })
    .lean();
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const result = await getResult(params.id, session.user.id) as any;
  if (!result) notFound();

  const pct = ((result.score / result.max_score) * 100).toFixed(1);
  const pass = result.score >= result.max_score * 0.4;
  const marksPerQuestion = result.exam_id?.total_questions
    ? result.exam_id.total_marks / result.exam_id.total_questions
    : 1;
  const negativePercent = result.exam_id?.negative_marking <= 1
    ? (result.exam_id?.negative_marking ?? 0) * 100
    : (result.exam_id?.negative_marking ?? 20);
  const negativePerWrong = (marksPerQuestion * negativePercent) / 100;

  return (
    <div className="page-wrap max-w-4xl space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-2">Test Result</h1>
        <p className="text-sm text-gray-500">{result.test_id?.title ?? 'Practice Session'}</p>
      </div>

      <div className={`card p-8 text-center border-2 ${pass ? 'border-emerald-300 dark:border-emerald-700' : 'border-red-300 dark:border-red-700'}`}>
        <div className={`text-5xl font-bold mb-2 ${pass ? 'text-emerald-600' : 'text-red-500'}`}>
          {result.score}<span className="text-2xl text-gray-400 font-normal">/{result.max_score}</span>
        </div>
        <div className={`text-lg font-medium mb-1 ${pass ? 'text-emerald-600' : 'text-red-500'}`}>
          {pass ? '✓ Passed' : '✗ Below passing mark'}
        </div>
        <p className="text-gray-400 text-sm">Score: {pct}% · Percentile: Top {result.percentile ? (100 - result.percentile).toFixed(0) : '—'}%</p>
        <div className="grid grid-cols-4 gap-4 mt-8">
          {[
            { l: 'Correct', v: result.correct_count, c: 'text-emerald-600' },
            { l: 'Wrong', v: result.wrong_count, c: 'text-red-500' },
            { l: 'Skipped', v: result.skipped_count, c: 'text-gray-400' },
            { l: 'Accuracy', v: `${result.accuracy_percent}%`, c: 'text-blue-600' },
          ].map(s => (
            <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <div className={`text-xl font-semibold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Negative Marking Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><div className="text-emerald-600 font-semibold">+{(result.correct_count * marksPerQuestion).toFixed(2)}</div><div className="text-gray-500 text-xs">Earned</div></div>
          <div><div className="text-red-500 font-semibold">−{(result.wrong_count * negativePerWrong).toFixed(2)}</div><div className="text-gray-500 text-xs">Deducted ({negativePercent}% each wrong)</div></div>
          <div><div className="text-blue-600 font-semibold">{result.score}</div><div className="text-gray-500 text-xs">Final score</div></div>
        </div>
      </div>

      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Subject Breakdown</h2>
        <div className="space-y-3">
          {result.subject_breakdown.map((sb: any) => (
            <div key={sb.subject_id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{sb.subject_name}</span>
                <span className={`text-sm font-semibold ${sb.accuracy_percent >= 70 ? 'text-emerald-600' : sb.accuracy_percent >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                  {sb.accuracy_percent}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${sb.accuracy_percent >= 70 ? 'bg-emerald-500' : sb.accuracy_percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${sb.accuracy_percent}%` }} />
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="text-emerald-600">✓ {sb.correct}</span>
                <span className="text-red-500">✗ {sb.wrong}</span>
                <span>— {sb.skipped}</span>
                <span>{sb.avg_time_per_question}s avg</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Question Review ({result.answers.length} questions)
        </h2>
        <ResultReview answers={JSON.parse(JSON.stringify(result.answers))} />
      </section>
    </div>
  );
}
