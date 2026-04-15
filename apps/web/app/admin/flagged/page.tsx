import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { AdminFlaggedClient } from '@/components/admin/AdminFlaggedClient';

async function getFlaggedQueue() {
  await connectDB();
  const results = await Result.find({ 'answers.flagged': true })
    .sort({ created_at: -1 })
    .limit(120)
    .select('answers user_id test_id exam_id created_at test_type score max_score')
    .populate('user_id', 'name email')
    .populate('test_id', 'title')
    .populate('exam_id', 'name')
    .populate({ path: 'answers.question_id', model: 'Question', select: 'question_text difficulty subject_id', populate: { path: 'subject_id', select: 'name' } })
    .lean();

  return results.flatMap((result: any) =>
    (result.answers ?? [])
      .filter((answer: any) => answer.flagged && answer.question_id)
      .map((answer: any) => ({
        resultId: String(result._id),
        questionId: String(answer.question_id?._id ?? ''),
        questionText: answer.question_id?.question_text ?? 'Question text unavailable',
        difficulty: answer.question_id?.difficulty ?? 'medium',
        subjectName: answer.question_id?.subject_id?.name ?? 'Unknown subject',
        userName: result.user_id?.name ?? 'Unknown user',
        userEmail: result.user_id?.email ?? '',
        testTitle: result.test_id?.title ?? 'Practice Session',
        examName: result.exam_id?.name ?? 'Unknown exam',
        score: result.score,
        maxScore: result.max_score,
        createdAt: result.created_at,
      }))
  );
}

export default async function AdminFlaggedPage() {
  const flaggedItems = await getFlaggedQueue();
  return <AdminFlaggedClient flaggedItems={JSON.parse(JSON.stringify(flaggedItems))} />;
}
