import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';
import { AppIcon } from '@/components/icons/AppIcon';
import { getUserPreferences } from '@/lib/user-preferences';

export default async function PracticeIndexPage() {
  const session = await getServerSession(authOptions);
  await connectDB();
  const preferences = session ? await getUserPreferences(session.user.id) : { targetExam: null };

  const exams = await Exam.find({ is_active: true })
    .select('name slug description')
    .sort({ name: 1 })
    .lean() as any[];

  const visibleExams = preferences.targetExam
    ? exams.filter((exam) => String(exam._id) === preferences.targetExam?._id)
    : exams;

  return (
    <div className="page-wrap">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Practice</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {preferences.targetExam
            ? `Showing practice content for ${preferences.targetExam.name}.`
            : 'Choose your exam, then select a subject for targeted practice.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleExams.map((exam) => (
          <Link key={exam._id} href={`/exams/${exam.slug}`} className="card p-5">
            <h2 className="font-semibold text-[var(--text)]">{exam.name}</h2>
            <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">{exam.description}</p>
            <p className="inline-flex items-center gap-1.5 text-sm text-[var(--brand)] mt-4 font-semibold">
              Choose Subject
              <AppIcon name="arrow-right" className="h-4 w-4" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
