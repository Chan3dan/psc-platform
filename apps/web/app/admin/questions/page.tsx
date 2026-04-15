import { connectDB } from '@/lib/db';
import { Question, Exam } from '@psc/shared/models';
import { BulkUploadClient } from '@/components/admin/BulkUploadClient';
import { QuestionBankModal } from '@/components/admin/QuestionBankModal';

export default async function AdminQuestionsPage() {
  await connectDB();
  const [exams, totalQuestions, recent] = await Promise.all([
    Exam.find({ is_active: true }).select('name slug _id').lean(),
    Question.countDocuments({}),
    Question.find({}).sort({ created_at: -1 }).limit(5000)
      .populate('subject_id', 'name').populate('exam_id', 'name').lean(),
  ]);
  return (
    <div className="page-wrap space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Questions</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Manage the MCQ question bank.</p>
        </div>
        <QuestionBankModal
          questions={JSON.parse(JSON.stringify(recent))}
          total={totalQuestions}
        />
      </div>
      <div className="card p-4 md:p-6">
        <h2 className="font-semibold text-[var(--text)] mb-4">Bulk Upload</h2>
        <BulkUploadClient exams={JSON.parse(JSON.stringify(exams))} />
      </div>
    </div>
  );
}
