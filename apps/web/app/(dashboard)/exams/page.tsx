import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';
import Link from 'next/link';
import { AppIcon } from '@/components/icons/AppIcon';

export default async function ExamsPage() {
  await connectDB();
  const exams = await Exam.find({ is_active: true })
    .select('name slug description duration_minutes total_marks total_questions negative_marking thumbnail_url')
    .lean() as any[];

  return (
    <div className="page-wrap">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)]">All Exams</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Choose an exam to start practising.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(exam => {
          const marksPerQuestion = exam.total_questions ? exam.total_marks / exam.total_questions : 1;
          const negativePercent = exam.negative_marking <= 1 ? exam.negative_marking * 100 : exam.negative_marking;
          const negativePerWrong = (marksPerQuestion * negativePercent) / 100;
          return (
          <Link key={exam.slug} href={`/exams/${exam.slug}`}
            className="card p-5 group">
            <h2 className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">{exam.name}</h2>
            <p className="text-sm text-[var(--muted)] mt-1 mb-3 line-clamp-2">{exam.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5"><AppIcon name="mock" className="h-3.5 w-3.5" /> {exam.duration_minutes}min</span>
              <span className="inline-flex items-center gap-1.5"><AppIcon name="questions" className="h-3.5 w-3.5" /> {exam.total_questions}q</span>
              <span className="text-red-500">−{negativePercent}% ({negativePerWrong.toFixed(2)}/wrong)</span>
            </div>
          </Link>
        )})}
      </div>
    </div>
  );
}
