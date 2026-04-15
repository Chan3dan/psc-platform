import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Note, Question } from '@psc/shared/models';
import { ok, unauthorized, serverError } from '@/lib/apiResponse';

type SearchType = 'question' | 'exam' | 'note';

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const { searchParams } = req.nextUrl;
    const q = (searchParams.get('q') ?? '').trim();
    const type = (searchParams.get('type') ?? '').trim().toLowerCase() as SearchType | '';
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') ?? '10'), 30));

    if (!q) {
      return ok({ query: '', results: { questions: [], exams: [], notes: [] }, combined: [] });
    }

    await connectDB();
    const safeRegex = new RegExp(escapeRegex(q), 'i');

    let questions: any[] = [];
    let exams: any[] = [];
    let notes: any[] = [];

    if (!type || type === 'question') {
      try {
        const docs = await Question.find(
          { is_active: true, $text: { $search: q } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .populate('exam_id', 'name slug')
          .populate('subject_id', 'name slug')
          .lean();
        questions = docs;
      } catch {
        questions = await Question.find({ is_active: true, question_text: safeRegex })
          .sort({ attempt_count: -1, created_at: -1 })
          .limit(limit)
          .populate('exam_id', 'name slug')
          .populate('subject_id', 'name slug')
          .lean();
      }
    }

    if (!type || type === 'exam') {
      exams = await Exam.find({
        is_active: true,
        $or: [{ name: safeRegex }, { description: safeRegex }],
      })
        .select('name slug description')
        .sort({ name: 1 })
        .limit(limit)
        .lean();
    }

    if (!type || type === 'note') {
      notes = await Note.find({
        is_active: true,
        title: safeRegex,
      })
        .select('title exam_id subject_id updatedAt')
        .populate('exam_id', 'name slug')
        .populate('subject_id', 'name slug')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
    }

    const normalized = {
      questions: questions.map((qDoc: any) => ({
        id: String(qDoc._id),
        type: 'question' as const,
        label: qDoc.question_text,
        subtitle: `${qDoc.exam_id?.name ?? 'Exam'} • ${qDoc.subject_id?.name ?? 'Subject'}`,
        href: qDoc.exam_id?.slug && qDoc.subject_id?.slug
          ? `/practice/${qDoc.exam_id.slug}/${qDoc.subject_id.slug}?question_id=${qDoc._id}`
          : '/practice',
      })),
      exams: exams.map((e: any) => ({
        id: String(e._id),
        type: 'exam' as const,
        label: e.name,
        subtitle: e.description ?? '',
        href: `/exams/${e.slug}`,
      })),
      notes: notes.map((n: any) => ({
        id: String(n._id),
        type: 'note' as const,
        label: n.title,
        subtitle: `${n.exam_id?.name ?? 'Exam'}${n.subject_id?.name ? ` • ${n.subject_id.name}` : ''}`,
        href: '/notes',
      })),
    };

    const combined = [...normalized.questions, ...normalized.exams, ...normalized.notes];
    return ok({ query: q, results: normalized, combined });
  } catch (e) {
    return serverError(e);
  }
}

