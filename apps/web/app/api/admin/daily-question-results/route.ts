import { Types } from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, QuestionOfDay, Result } from '@psc/shared/models';
import { forbidden, ok, serverError, unauthorized } from '@/lib/apiResponse';
import { getKathmanduDateKey } from '@/lib/question-of-day';

export const dynamic = 'force-dynamic';

function normalizeOption(option: any, index: number) {
  if (typeof option === 'string') return { index, text: option };
  const optionIndex = Number(option?.index);
  return {
    index: Number.isFinite(optionIndex) ? optionIndex : index,
    text: String(option?.text ?? option?.label ?? ''),
  };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const { searchParams } = new URL(req.url);
    const dateKey = searchParams.get('date') || getKathmanduDateKey();
    const examId = searchParams.get('exam_id');

    await connectDB();

    const filter: Record<string, any> = {
      test_type: 'daily_question',
      'result_context.submitted_for_date': dateKey,
    };
    if (examId && Types.ObjectId.isValid(examId)) {
      filter.exam_id = examId;
    }

    const [results, questionDocs, exams] = await Promise.all([
      Result.find(filter)
        .select('score max_score accuracy_percent total_time_seconds created_at user_id exam_id answers result_context')
        .populate('user_id', 'name email')
        .populate('exam_id', 'name')
        .populate({
          path: 'answers.question_id',
          model: 'Question',
          select: 'question_text options correct_answer explanation subject_id',
          populate: { path: 'subject_id', model: 'Subject', select: 'name' },
        })
        .sort({ created_at: -1 })
        .lean() as Promise<any[]>,
      QuestionOfDay.find({
        prompt_date_key: dateKey,
        ...(examId && Types.ObjectId.isValid(examId) ? { exam_id: examId } : {}),
      })
        .populate('exam_id', 'name')
        .populate('subject_id', 'name')
        .populate('question_id', 'question_text options correct_answer explanation')
        .lean() as Promise<any[]>,
      Exam.find({ is_active: true }).select('name').sort({ name: 1 }).lean() as Promise<any[]>,
    ]);

    const questionSummaries = questionDocs.map((item: any) => {
      const question = item.question_id;
      return {
        question_of_day_id: String(item._id),
        exam_id: item.exam_id ? String(item.exam_id._id) : '',
        exam_name: item.exam_id?.name ?? 'Unknown exam',
        subject_name: item.subject_id?.name ?? 'General',
        question_text: question?.question_text ?? '',
        correct_answer: question?.correct_answer ?? null,
        options: Array.isArray(question?.options)
          ? question.options.map(normalizeOption).filter((option: any) => option.text)
          : [],
      };
    });

    const rows = results.map((result: any) => {
      const answer = result.answers?.[0] ?? null;
      const question = answer?.question_id ?? null;
      const options = Array.isArray(question?.options)
        ? question.options.map(normalizeOption).filter((option: any) => option.text)
        : [];
      const selectedOption = answer?.selected_option ?? null;
      const selectedLabel =
        selectedOption === null || selectedOption === undefined
          ? 'Not selected'
          : `Option ${String.fromCharCode(65 + Number(selectedOption))}`;

      return {
        result_id: String(result._id),
        user_id: result.user_id ? String(result.user_id._id) : '',
        user_name: result.user_id?.name ?? 'Unknown user',
        user_email: result.user_id?.email ?? '',
        exam_name: result.exam_id?.name ?? 'Unknown exam',
        subject_name: question?.subject_id?.name ?? 'General',
        question_text: question?.question_text ?? '',
        options,
        correct_answer: question?.correct_answer ?? null,
        selected_option: selectedOption,
        selected_label: selectedLabel,
        is_correct: Boolean(answer?.is_correct),
        score: result.score,
        max_score: result.max_score,
        accuracy_percent: result.accuracy_percent ?? 0,
        total_time_seconds: result.total_time_seconds ?? 0,
        submitted_at: result.created_at,
      };
    });

    const correct = rows.filter((row) => row.is_correct).length;
    const wrong = rows.length - correct;

    return ok({
      date: dateKey,
      exams: exams.map((exam: any) => ({ _id: String(exam._id), name: exam.name })),
      questionSummaries,
      summary: {
        total: rows.length,
        correct,
        wrong,
        accuracy_percent: rows.length ? Math.round((correct / rows.length) * 100) : 0,
      },
      rows,
    });
  } catch (error) {
    return serverError(error);
  }
}
