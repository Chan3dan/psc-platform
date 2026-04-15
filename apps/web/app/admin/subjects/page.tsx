// ── FILE: app/admin/subjects/page.tsx ────────────────────────
import { connectDB } from '@/lib/db';
import { Subject, Exam } from '@psc/shared/models';
import { SubjectManager } from '@/components/admin/SubjectManager';

export default async function AdminSubjectsPage() {
  await connectDB();
  const [exams, subjects] = await Promise.all([
    Exam.find({ is_active: true }).select('_id name slug').lean(),
    Subject.find({}).sort({ exam_id: 1, name: 1 }).populate('exam_id', 'name').lean(),
  ]);
  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Subjects</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Manage subjects for each exam.</p>
      </div>
      <SubjectManager
        exams={JSON.parse(JSON.stringify(exams))}
        initialSubjects={JSON.parse(JSON.stringify(subjects))}
      />
    </div>
  );
}
