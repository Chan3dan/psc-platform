import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { AdminResultsClient } from '@/components/admin/AdminResultsClient';

async function getResults() {
  await connectDB();
  return Result.find({})
    .sort({ created_at: -1 })
    .limit(150)
    .populate('user_id', 'name email')
    .populate('test_id', 'title')
    .populate('exam_id', 'name')
    .lean();
}

export default async function AdminResultsPage() {
  const results = await getResults() as any[];
  return <AdminResultsClient results={JSON.parse(JSON.stringify(results))} />;
}
