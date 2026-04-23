import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AppIcon } from '@/components/icons/AppIcon';
import { getExamCatalogBySlug } from '@/lib/catalog-data';

export default async function ExamDetailPage({ params }: { params: { slug: string } }) {
  const data = await getExamCatalogBySlug(params.slug);
  if (!data) notFound();
  const { exam, subjects, mockTests } = data as any;
  const marksPerQuestion = exam.total_questions ? exam.total_marks / exam.total_questions : 1;
  const negativePercent = exam.negative_marking <= 1 ? exam.negative_marking * 100 : exam.negative_marking;
  const negativePerWrong = (marksPerQuestion * negativePercent) / 100;
  const syllabusLines = String(exam.syllabus_outline ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="page-wrap space-y-8">
      <div>
        <Link href="/exams" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">
          All Exams
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text)] mt-2">{exam.name}</h1>
        <p className="text-[var(--muted)] text-sm mt-1">{exam.description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <AppIcon name="mock" className="h-4 w-4" />
            <strong>{exam.duration_minutes}</strong> min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AppIcon name="questions" className="h-4 w-4" />
            <strong>{exam.total_questions}</strong> questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AppIcon name="analytics" className="h-4 w-4" />
            <strong>{exam.total_marks}</strong> marks
          </span>
          <span className="inline-flex items-center gap-1.5 text-red-500">
            <AppIcon name="alert" className="h-4 w-4" />
            <strong>{negativePercent}%</strong> ({negativePerWrong.toFixed(2)} per wrong)
          </span>
        </div>
      </div>

      <section className="card p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Syllabus Overview</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Use this as your preparation map before choosing subjects, mocks, or notes.
            </p>
          </div>
          {exam.syllabus_pdf_url && (
            <a href="#syllabus-pdf" className="btn-secondary text-sm inline-flex">
              View syllabus PDF
            </a>
          )}
        </div>

        {syllabusLines.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {syllabusLines.map((line, index) => (
              <div key={`${line}-${index}`} className="flex items-start gap-3 rounded-xl border border-[var(--line)] px-3 py-2.5">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">
                  {index + 1}
                </span>
                <p className="text-sm text-[var(--text)]">{line.replace(/^[-*]\s*/, '')}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(subjects as any[]).map((sub) => (
              <Link key={sub._id} href={`/practice/${exam.slug}/${sub.slug}`} className="rounded-xl border border-[var(--line)] px-3 py-2.5 hover:bg-[var(--brand-soft)]/35">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">{sub.name}</span>
                  <span className="badge-blue">{sub.weightage_percent}%</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{sub.question_count} questions available</p>
              </Link>
            ))}
          </div>
        )}

        {exam.syllabus_pdf_url && (
          <div id="syllabus-pdf" className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <iframe
              title={`${exam.name} syllabus`}
              src={exam.syllabus_pdf_url}
              className="h-[70vh] w-full"
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-[var(--text)] mb-3">Practice by Subject</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(subjects as any[]).map(sub => (
            <Link key={sub._id} href={`/practice/${exam.slug}/${sub.slug}`}
              className="card p-4 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">{sub.name}</h3>
                  {sub.description && <p className="text-xs text-[var(--muted)] mt-0.5">{sub.description}</p>}
                </div>
                <span className="badge-blue">{sub.weightage_percent}%</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">{sub.question_count} questions</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[var(--text)] mb-3">Mock Tests</h2>
        {mockTests.length === 0
          ? <p className="text-sm text-[var(--muted)] py-4 text-center card p-6">No mock tests available yet.</p>
          : <div className="space-y-3">
            {(mockTests as any[]).map(mt => (
              <div key={mt._id} className="card p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--text)]">{mt.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      <AppIcon name="mock" className="h-3.5 w-3.5" />
                      {mt.duration_minutes}min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <AppIcon name="questions" className="h-3.5 w-3.5" />
                      {mt.total_questions}q
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <AppIcon name="users" className="h-3.5 w-3.5" />
                      {mt.attempt_count} attempts
                    </span>
                  </div>
                </div>
                <Link href={`/mock/${exam.slug}?test=${mt._id}`} className="btn-primary text-sm">Start Test</Link>
              </div>
            ))}
          </div>
        }
      </section>
    </div>
  );
}
