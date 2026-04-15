import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';

export default async function PracticeIndexPage() {
  await connectDB();
  const exams = await Exam.find({ is_active: true })
    .select('name slug description')
    .sort({ name: 1 })
    .lean() as any[];

  return (
    <div className="page-wrap">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Practice</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Choose your exam, then select a subject for targeted practice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <Link key={exam._id} href={`/exams/${exam.slug}`} className="card p-5">
            <h2 className="font-semibold text-[var(--text)]">{exam.name}</h2>
            <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">{exam.description}</p>
            <p className="text-sm text-[var(--brand)] mt-4 font-semibold">Choose Subject →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
