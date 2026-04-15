import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Question } from '@psc/shared/models';
import { unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { Types } from 'mongoose';

function escapeCsv(value: unknown) {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const { searchParams } = req.nextUrl;
    const format = (searchParams.get('format') ?? 'json').toLowerCase();
    const exam_id = searchParams.get('exam_id');
    const subject_id = searchParams.get('subject_id');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '10000'), 1), 20000);

    await connectDB();

    const filter: Record<string, unknown> = { is_active: true };
    if (exam_id && Types.ObjectId.isValid(exam_id)) filter.exam_id = new Types.ObjectId(exam_id);
    if (subject_id && Types.ObjectId.isValid(subject_id)) filter.subject_id = new Types.ObjectId(subject_id);

    const questions = await Question.find(filter)
      .select('question_text question_image_url options correct_answer explanation difficulty year tags exam_id subject_id')
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'csv') {
      const header = [
        'question_text',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_answer',
        'explanation',
        'difficulty',
        'year',
        'tags',
        'question_image_url',
        'option_a_image_url',
        'option_b_image_url',
        'option_c_image_url',
        'option_d_image_url',
      ];

      const rows = questions.map((q: any) => {
        const opt = Array.isArray(q.options) ? q.options : [];
        return [
          q.question_text ?? '',
          opt[0]?.text ?? '',
          opt[1]?.text ?? '',
          opt[2]?.text ?? '',
          opt[3]?.text ?? '',
          q.correct_answer ?? 0,
          q.explanation ?? '',
          q.difficulty ?? 'medium',
          q.year ?? '',
          Array.isArray(q.tags) ? q.tags.join('|') : '',
          q.question_image_url ?? '',
          opt[0]?.image_url ?? '',
          opt[1]?.image_url ?? '',
          opt[2]?.image_url ?? '',
          opt[3]?.image_url ?? '',
        ].map(escapeCsv).join(',');
      });

      const csv = [header.join(','), ...rows].join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="questions-export-${ts}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(questions, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="questions-export-${ts}.json"`,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}

