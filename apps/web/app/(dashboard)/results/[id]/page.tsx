import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ResultDetails } from '@/components/exam/ResultDetails';
import { formatDuration, formatResultDateTime } from '@/lib/results';

async function getResult(id: string, userId: string) {
  await connectDB();
  return Result.findOne({ _id: id, user_id: userId })
    .populate('test_id', 'title')
    .populate('exam_id', 'total_marks total_questions negative_marking')
    .populate({ path: 'answers.question_id', model: 'Question',
      select: 'question_text options correct_answer explanation subject_id difficulty',
      populate: { path: 'subject_id', select: 'name' } })
    .lean();
}

export default async function ResultPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const result = await getResult(params.id, session.user.id) as any;
  if (!result) notFound();
  return (
    <ResultDetails
      result={result}
      backHref="/dashboard"
      backLabel="Dashboard"
      heading="Test Result"
      subtitle={result.test_id?.title ?? 'Practice Session'}
      metaItems={[
        { label: 'Type', value: result.test_type ?? 'unknown' },
        { label: 'Duration', value: formatDuration(result.total_time_seconds) },
        { label: 'Submitted', value: formatResultDateTime(result.created_at) },
      ]}
    />
  );
}
