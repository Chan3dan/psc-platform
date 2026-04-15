import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ResultDetails } from '@/components/exam/ResultDetails';
import { formatDuration, formatResultDateTime } from '@/lib/results';

async function getResult(id: string) {
  await connectDB();
  return Result.findById(id)
    .populate('user_id', 'name email')
    .populate('test_id', 'title')
    .populate('exam_id', 'name total_marks total_questions negative_marking')
    .populate({
      path: 'answers.question_id',
      model: 'Question',
      select: 'question_text options correct_answer explanation subject_id difficulty',
      populate: { path: 'subject_id', select: 'name' },
    })
    .lean();
}

export default async function AdminResultDetailPage({ params }: { params: { id: string } }) {
  const result = await getResult(params.id) as any;
  if (!result) notFound();

  const flaggedCount = Array.isArray(result.answers)
    ? result.answers.filter((answer: any) => answer.flagged).length
    : 0;

  return (
    <ResultDetails
      result={result}
      backHref="/admin/results"
      backLabel="Results"
      heading="Attempt Review"
      subtitle={result.test_id?.title ?? 'Practice Session'}
      metaItems={[
        { label: 'User', value: result.user_id?.name ?? 'Unknown user' },
        { label: 'Email', value: result.user_id?.email ?? 'No email' },
        { label: 'Exam', value: result.exam_id?.name ?? 'Unknown exam' },
        { label: 'Type', value: result.test_type ?? 'unknown' },
        { label: 'Flagged', value: String(flaggedCount) },
        { label: 'Duration', value: formatDuration(result.total_time_seconds) },
        { label: 'Submitted', value: formatResultDateTime(result.created_at) },
      ]}
      actionItems={
        result.user_id?.email || result.user_id?._id
          ? [{ label: 'Find User', href: `/admin/users?query=${encodeURIComponent(result.user_id.email ?? result.user_id._id)}` }]
          : []
      }
    />
  );
}
