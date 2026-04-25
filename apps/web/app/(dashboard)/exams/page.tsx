import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { AppIcon } from '@/components/icons/AppIcon';
import { getActiveExams } from '@/lib/catalog-data';
import { authOptions } from '@/lib/auth';
import { getUserPreferences } from '@/lib/user-preferences';
import { UPCOMING_EXAM_TRACKS } from '@/lib/exam-tracks';

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);
  const preferences = session ? await getUserPreferences(session.user.id) : { targetExam: null };
  const exams = (await getActiveExams()) as any[];
  const selectedExams = preferences.targetExam
    ? exams.filter((exam) => String(exam._id) === preferences.targetExam?._id)
    : exams;

  return (
    <div className="page-wrap">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)]">All Exams</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {preferences.targetExam
            ? `Your app is currently focused on ${preferences.targetExam.name}.`
            : 'Choose an exam to start practising.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedExams.map(exam => {
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

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--text)]">Coming Soon</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">More exam tracks can be requested from the dashboard feedback panel.</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {UPCOMING_EXAM_TRACKS.filter((track) => track.status === 'coming_soon').map((track) => (
            <div key={track.slug} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[var(--text)]">{track.name}</h3>
                <span className="badge-amber">Coming soon</span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2">{track.description}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
                <AppIcon name="idea" className="h-3.5 w-3.5" />
                Request from feedback form
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
