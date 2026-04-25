import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { StudyPlan, Exam } from '@psc/shared/models';
import { PlannerClient } from '@/components/planner/PlannerClient';
import { getUserPreferences } from '@/lib/user-preferences';

export default async function PlannerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const preferences = await getUserPreferences(session.user.id);
  await connectDB();
  const [plan, exams] = await Promise.all([
    StudyPlan.findOne({ user_id: session.user.id, is_active: true }).populate('exam_id', 'name slug').lean(),
    Exam.find({ is_active: true }).select('_id name slug').lean(),
  ]);
  const visibleExams = preferences.targetExam
    ? exams.filter((exam: any) => String(exam._id) === preferences.targetExam?._id)
    : exams;
  return (
    <div className="page-wrap max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Study Planner</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {preferences.targetExam
            ? `Build a personalised daily routine for ${preferences.targetExam.name}.`
            : 'Build a personalised daily routine for your exam.'}
        </p>
      </div>
      <PlannerClient
        initialPlan={plan ? JSON.parse(JSON.stringify(plan)) : null}
        exams={JSON.parse(JSON.stringify(visibleExams))}
        initialExamId={preferences.targetExam?._id ?? undefined}
      />
    </div>
  );
}
