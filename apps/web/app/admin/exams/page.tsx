import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';
import { ExamManager } from '@/components/admin/ExamManager';

export default async function AdminExamsPage() {
  await connectDB();
  const exams = await Exam.find({}).sort({ created_at: -1 }).lean();
  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Exams</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Manage all exam types. Changes apply platform-wide.</p>
      </div>
      <ExamManager initialExams={JSON.parse(JSON.stringify(exams))} />
    </div>
  );
}
