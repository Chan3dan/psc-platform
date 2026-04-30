import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { StudyPlan, Exam, Subject } from '@psc/shared/models';
import { PlannerClient } from '@/components/planner/PlannerClient';
import { getUserPreferences } from '@/lib/user-preferences';
import { getPlannerTodayPayload } from '@/lib/planner-smart';

export default async function PlannerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const preferences = await getUserPreferences(session.user.id);
  await connectDB();
  const [plan, exams, subjects, initialToday] = await Promise.all([
    StudyPlan.findOne({ user_id: session.user.id, is_active: true }).populate('exam_id', 'name slug').lean(),
    Exam.find({ is_active: true }).select('_id name slug').lean(),
    Subject.find({ is_active: true }).select('_id name slug exam_id weightage_percent').lean(),
    getPlannerTodayPayload(session.user.id),
  ]);
  const visibleExams = preferences.targetExam
    ? exams.filter((exam: any) => String(exam._id) === preferences.targetExam?._id)
    : exams;
  const visibleExamIds = new Set(visibleExams.map((exam: any) => String(exam._id)));
  const subjectsByExam = subjects.reduce((acc: Record<string, any[]>, subject: any) => {
    const examId = String(subject.exam_id);
    if (!visibleExamIds.has(examId)) return acc;
    acc[examId] = acc[examId] ?? [];
    acc[examId].push({
      _id: String(subject._id),
      name: subject.name,
      slug: subject.slug,
      weightage_percent: subject.weightage_percent,
    });
    return acc;
  }, {});

  return (
    <div className="page-wrap max-w-7xl">
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
        subjectsByExam={JSON.parse(JSON.stringify(subjectsByExam))}
        initialToday={JSON.parse(JSON.stringify(initialToday))}
        initialExamId={preferences.targetExam?._id ? String(preferences.targetExam._id) : undefined}
      />
    </div>
  );
}
