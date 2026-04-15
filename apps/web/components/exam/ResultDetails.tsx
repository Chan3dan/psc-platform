import Link from 'next/link';
import { ResultReview } from '@/components/exam/ResultReview';
import { AppIcon } from '@/components/icons/AppIcon';
import { formatDuration } from '@/lib/results';

export function ResultDetails({
  result,
  backHref,
  backLabel,
  heading,
  subtitle,
  metaItems = [],
  actionItems = [],
}: {
  result: any;
  backHref: string;
  backLabel: string;
  heading: string;
  subtitle?: string;
  metaItems?: Array<{ label: string; value: string }>;
  actionItems?: Array<{ label: string; href: string }>;
}) {
  const pct = ((result.score / result.max_score) * 100).toFixed(1);
  const pass = result.score >= result.max_score * 0.4;
  const marksPerQuestion = result.exam_id?.total_questions
    ? result.exam_id.total_marks / result.exam_id.total_questions
    : 1;
  const negativePercent = result.exam_id?.negative_marking <= 1
    ? (result.exam_id?.negative_marking ?? 0) * 100
    : (result.exam_id?.negative_marking ?? 20);
  const negativePerWrong = (marksPerQuestion * negativePercent) / 100;
  const flaggedCount = Array.isArray(result.answers)
    ? result.answers.filter((answer: any) => Boolean(answer?.flagged)).length
    : 0;
  const duration = formatDuration(result.total_time_seconds);

  return (
    <div className="page-wrap max-w-5xl space-y-8">
      <div>
        <Link href={backHref} className="text-sm text-[var(--muted)] hover:text-[var(--text)]">{backLabel}</Link>
        <h1 className="text-2xl font-semibold text-[var(--text)] mt-2">{heading}</h1>
        {subtitle && <p className="text-sm text-[var(--muted)]">{subtitle}</p>}
        {metaItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {metaItems.map((item) => (
              <span key={`${item.label}-${item.value}`} className="badge-gray">
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={backHref} className="btn-secondary inline-flex items-center gap-2">
          <AppIcon name="arrow-right" className="h-4 w-4 rotate-180" />
          Back
        </Link>
        {actionItems.map((action) => (
          <Link key={`${action.label}-${action.href}`} href={action.href} className="btn-secondary inline-flex items-center gap-2">
            <AppIcon name="results" className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
        <span className="badge-gray inline-flex items-center gap-1.5">
          <AppIcon name="mock" className="h-3.5 w-3.5" />
          Attempt Time: {duration}
        </span>
        <span className="badge-gray inline-flex items-center gap-1.5">
          <AppIcon name="questions" className="h-3.5 w-3.5" />
          {result.answers.length} questions reviewed
        </span>
      </div>

      <div className={`card p-6 md:p-8 text-center border-2 ${pass ? 'border-emerald-300 dark:border-emerald-700' : 'border-red-300 dark:border-red-700'}`}>
        <div className={`text-5xl font-bold mb-2 ${pass ? 'text-emerald-600' : 'text-red-500'}`}>
          {result.score}<span className="text-2xl text-[var(--muted)] font-normal">/{result.max_score}</span>
        </div>
        <div className={`text-lg font-medium mb-1 ${pass ? 'text-emerald-600' : 'text-red-500'}`}>
          <span className="inline-flex items-center gap-2 justify-center">
            <AppIcon name={pass ? 'check' : 'alert'} className="h-5 w-5" />
            {pass ? 'Passed' : 'Below passing mark'}
          </span>
        </div>
        <p className="text-[var(--muted)] text-sm">Score: {pct}% · Percentile: Top {result.percentile ? (100 - result.percentile).toFixed(0) : '—'}%</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4 mt-6 md:mt-8">
          {[
            { l: 'Correct', v: result.correct_count, c: 'text-emerald-600' },
            { l: 'Wrong', v: result.wrong_count, c: 'text-red-500' },
            { l: 'Skipped', v: result.skipped_count, c: 'text-[var(--muted)]' },
            { l: 'Flagged', v: flaggedCount, c: 'text-amber-600' },
            { l: 'Accuracy', v: `${result.accuracy_percent}%`, c: 'text-blue-600' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl p-3 border border-[var(--line)] bg-[color:color-mix(in_oklab,var(--bg-elev)_92%,#ffffff_8%)]">
              <div className={`text-xl font-semibold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-[var(--text)]">Subject Breakdown</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge-gray">+{(result.correct_count * marksPerQuestion).toFixed(2)} earned</span>
            <span className="badge-gray">−{(result.wrong_count * negativePerWrong).toFixed(2)} deducted</span>
          </div>
        </div>
        <div className="space-y-3">
          {result.subject_breakdown.map((sb: any) => (
            <div key={sb.subject_id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--text)]">{sb.subject_name}</span>
                <span className={`text-sm font-semibold ${sb.accuracy_percent >= 70 ? 'text-emerald-600' : sb.accuracy_percent >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                  {sb.accuracy_percent}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${sb.accuracy_percent >= 70 ? 'bg-emerald-500' : sb.accuracy_percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${sb.accuracy_percent}%` }} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
                <span className="text-emerald-600">Correct {sb.correct}</span>
                <span className="text-red-500">Wrong {sb.wrong}</span>
                <span>Skipped {sb.skipped}</span>
                <span>{sb.avg_time_per_question}s avg</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[var(--text)] mb-4">
          Question Review ({result.answers.length} questions)
        </h2>
        <ResultReview answers={JSON.parse(JSON.stringify(result.answers))} />
      </section>
    </div>
  );
}
