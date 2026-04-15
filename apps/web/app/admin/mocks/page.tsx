import { connectDB } from '@/lib/db';
import { Exam, MockTest } from '@psc/shared/models';
import { MockTestManager } from '@/components/admin/MockTestManager';

export default async function AdminMocksPage() {
  await connectDB();
  const [exams, mocks] = await Promise.all([
    Exam.find({ is_active: true }).select('_id name slug negative_marking total_marks total_questions').sort({ name: 1 }).lean(),
    MockTest.find({})
      .populate('exam_id', 'name slug')
      .populate('config.subject_distribution.subject_id', 'name slug')
      .sort({ created_at: -1 })
      .lean(),
  ]);

  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Mock Tests</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Create mock tests and manage existing ones from the modal in the header card.</p>
      </div>
      <MockTestManager exams={JSON.parse(JSON.stringify(exams))} initialMocks={JSON.parse(JSON.stringify(mocks))} />
    </div>
  );
}
