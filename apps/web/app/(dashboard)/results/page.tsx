import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ResultsHistoryClient } from '@/components/results/ResultsHistoryClient';

async function getResults(userId: string) {
  await connectDB();
  return Result.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(150)
    .populate('test_id', 'title')
    .populate('exam_id', 'name')
    .lean();
}

export default async function ResultsHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const results = await getResults(session.user.id) as any[];
  return <ResultsHistoryClient results={JSON.parse(JSON.stringify(results))} />;
}
