import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ok, serverError, unauthorized } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function getReason(answer: any) {
  if (answer?.flagged) return 'flagged';
  if (answer?.selected_option === null || answer?.selected_option === undefined) return 'skipped';
  if (!answer?.is_correct) return 'wrong';
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const results = await Result.find({ user_id: session.user.id })
      .sort({ created_at: -1 })
      .limit(25)
      .select('answers created_at exam_id')
      .populate({
        path: 'answers.question_id',
        model: 'Question',
        select: 'question_text options correct_answer explanation subject_id difficulty exam_id',
        populate: [
          { path: 'subject_id', select: 'name slug' },
          { path: 'exam_id', select: 'slug' },
        ],
      })
      .lean();

    const seen = new Set<string>();
    const items: any[] = [];

    for (const result of results as any[]) {
      for (const answer of result.answers ?? []) {
        const question = answer.question_id;
        if (!question?._id) continue;
        const reason = getReason(answer);
        if (!reason) continue;
        const qid = String(question._id);
        const key = `${qid}:${reason}`;
        if (seen.has(key)) continue;
        seen.add(key);

        items.push({
          id: `${String(result._id)}:${qid}:${reason}`,
          reason,
          flagged: Boolean(answer.flagged),
          selected_option: answer.selected_option ?? null,
          attempted_at: result.created_at,
          question: {
            _id: qid,
            question_text: question.question_text,
            options: question.options ?? [],
            correct_answer: question.correct_answer,
            explanation: question.explanation ?? '',
            difficulty: question.difficulty ?? 'mixed',
            subject_name: question.subject_id?.name ?? 'Unknown subject',
            practice_href:
              question.exam_id?.slug && question.subject_id?.slug
                ? `/practice/${question.exam_id.slug}/${question.subject_id.slug}?question_id=${qid}`
                : '',
          },
        });
      }
    }

    const limited = items.slice(0, 80);
    const counts = {
      all: limited.length,
      wrong: limited.filter((item) => item.reason === 'wrong').length,
      skipped: limited.filter((item) => item.reason === 'skipped').length,
      flagged: limited.filter((item) => item.flagged).length,
    };

    return ok({ items: limited, counts });
  } catch (error) {
    return serverError(error);
  }
}
