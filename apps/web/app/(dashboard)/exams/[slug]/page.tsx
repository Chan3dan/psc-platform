import { notFound } from 'next/navigation';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Exam, Subject, MockTest } from '@psc/shared/models';

async function getData(slug: string) {
  await connectDB();
  const exam = await Exam.findOne({ slug, is_active: true }).lean() as any;
  if (!exam) return null;
  const [subjects, mockTests] = await Promise.all([
    Subject.find({ exam_id: exam._id, is_active: true }).select('name slug weightage_percent question_count description').lean(),
    MockTest.find({ exam_id: exam._id, is_active: true }).select('_id title slug duration_minutes total_questions attempt_count').lean(),
  ]);
  return { exam, subjects, mockTests };
}

export default async function ExamDetailPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const { exam, subjects, mockTests } = data as any;
  const marksPerQuestion = exam.total_questions ? exam.total_marks / exam.total_questions : 1;
  const negativePercent = exam.negative_marking <= 1 ? exam.negative_marking * 100 : exam.negative_marking;
  const negativePerWrong = (marksPerQuestion * negativePercent) / 100;

  return (
    <div className="page-wrap space-y-8">
      <div>
        <Link href="/exams" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">← All Exams</Link>
        <h1 className="text-2xl font-semibold text-[var(--text)] mt-2">{exam.name}</h1>
        <p className="text-[var(--muted)] text-sm mt-1">{exam.description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--muted)]">
          <span>⏱ <strong>{exam.duration_minutes}</strong> min</span>
          <span>📝 <strong>{exam.total_questions}</strong> questions</span>
          <span>⭐ <strong>{exam.total_marks}</strong> marks</span>
          <span className="text-red-500">➖ <strong>{negativePercent}%</strong> ({negativePerWrong.toFixed(2)} per wrong)</span>
        </div>
      </div>

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
                    <span>⏱ {mt.duration_minutes}min</span>
                    <span>📝 {mt.total_questions}q</span>
                    <span>👥 {mt.attempt_count} attempts</span>
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
